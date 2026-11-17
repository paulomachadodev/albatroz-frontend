import { dataCalendarioLocal, lerDataLocal } from '../../../../../shared/utils/data-local.util';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { IaConsumoService } from '../../services/ia-consumo.service';
import { IaConsumo } from '../../models/ia-consumo.model';

@Component({
  selector: 'app-ia-consumo',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, InputTextModule, SelectModule, BreadcrumbComponent, PageHeaderComponent, ListagemPaginadaComponent],
  templateUrl: './ia-consumo.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class IaConsumoComponent {
  private readonly auth = inject(AuthService);
  private readonly service = inject(IaConsumoService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly usuarioInicial = this.auth.usuario()?.id;
  private readonly empresaInicial = this.auth.empresaIdAtual();
  private consulta?: Subscription;
  private readonly hoje = new Date();
  private readonly inicioPadrao = dataCalendarioLocal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1));
  private readonly fimPadrao = dataCalendarioLocal(new Date(this.hoje.getFullYear(), this.hoje.getMonth() + 1, 1));
  readonly form = inject(FormBuilder).nonNullable.group({ inicio: this.inicioPadrao, fim: this.fimPadrao, finalidade: '', modelo: '', status: 0 });
  readonly dados = signal<IaConsumo | null>(null);
  readonly carregando = signal(true);
  readonly pagina = signal(1);
  readonly tamanhoPagina = signal(10);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil((this.dados()?.total ?? 0) / this.tamanhoPagina())));
  readonly contextoValido = computed(() => this.auth.usuario()?.id === this.usuarioInicial && this.auth.empresaIdAtual() === this.empresaInicial && this.auth.temPermissao('ia_consumo:ler'));
  private periodoAplicado = this.form.getRawValue();
  readonly finalidades = [{ rotulo: 'Todas', valor: '' }, { rotulo: 'Validação Google', valor: 'validacao_google' }];
  readonly resultados = [{ rotulo: 'Todos', valor: 0 }, { rotulo: 'Pendente', valor: 1 }, { rotulo: 'Sucesso', valor: 2 }, { rotulo: 'Falha', valor: 3 }, { rotulo: 'Indeterminada', valor: 4 }];
  readonly selectPt = {
    root: 'relative block w-full',
    label: 'block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap',
    dropdown: 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400',
    overlay: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50',
    list: 'py-1', option: 'px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'
  };

  constructor() {
    effect(() => {
      if (!this.contextoValido()) {
        this.consulta?.unsubscribe();
        this.dados.set(null);
        this.carregando.set(false);
        void this.router.navigate(['/configuracoes'], { replaceUrl: true });
      }
    });
    this.carregar();
  }

  aplicar(): void {
    const periodo = this.form.getRawValue();
    const inicio = lerDataLocal(periodo.inicio);
    const fim = lerDataLocal(periodo.fim);
    if (!inicio || !fim || fim <= inicio || fim.getTime() - inicio.getTime() > 366 * 86400000) {
      this.toast.aviso('Período inválido.', 'Informe datas locais válidas, com fim posterior ao início e até 366 dias.');
      return;
    }
    this.periodoAplicado = periodo;
    this.pagina.set(1);
    this.carregar();
  }

  mudarPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.carregar();
  }

  mudarTamanho(tamanho: number): void {
    this.tamanhoPagina.set(tamanho);
    this.pagina.set(1);
    this.carregar();
  }

  status(valor: number): string {
    return ({ 1: 'Pendente', 2: 'Sucesso', 3: 'Falha', 4: 'Indeterminada' } as Record<number, string>)[valor] ?? 'Desconhecido';
  }

  custo(valor: number | null): string {
    if (valor === null) return 'Pendente';
    if (valor > 0 && valor < 0.000000000001) return 'USD < 0,000000000001';
    return 'USD ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 12 }).format(valor);
  }

  fonte(valor: string | null): string | null {
    if (!valor) return null;
    try {
      const url = new URL(valor);
      return url.protocol === 'https:' && url.hostname === 'ai.google.dev' ? url.href : null;
    } catch {
      return null;
    }
  }


  private carregar(): void {
    this.consulta?.unsubscribe();
    if (!this.contextoValido()) return;
    this.carregando.set(true);
    this.dados.set(null);
    this.consulta = this.service.listar({ inicio: lerDataLocal(this.periodoAplicado.inicio)!.toISOString(), fim: lerDataLocal(this.periodoAplicado.fim)!.toISOString(), pagina: this.pagina(), tamanhoPagina: this.tamanhoPagina(), ...(this.periodoAplicado.finalidade && { finalidade: this.periodoAplicado.finalidade }), ...(this.periodoAplicado.modelo.trim() && { modelo: this.periodoAplicado.modelo.trim() }), ...(this.periodoAplicado.status && { status: this.periodoAplicado.status }) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: resposta => {
          if (!this.contextoValido()) return;
          if (resposta.sucesso && resposta.dados) this.dados.set(resposta.dados);
          else this.toast.erro('Não foi possível consultar o consumo de IA.');
          this.carregando.set(false);
        },
        error: erro => {
          if (!this.contextoValido()) return;
          this.toast.erroServidor(erro, 'Não foi possível consultar o consumo de IA. Tente novamente.');
          this.carregando.set(false);
        }
      });
  }
}
