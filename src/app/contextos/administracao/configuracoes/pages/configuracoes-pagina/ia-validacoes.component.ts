import { dataCalendarioLocal, lerDataLocal } from '../../../../../shared/utils/data-local.util';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { IaValidacoesService } from '../../services/ia-validacoes.service';
import { IaValidacoes } from '../../models/ia-validacoes.model';

@Component({
  selector: 'app-ia-validacoes',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, InputTextModule, BreadcrumbComponent, PageHeaderComponent, ListagemPaginadaComponent],
  templateUrl: './ia-validacoes.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class IaValidacoesComponent {
  private readonly auth = inject(AuthService);
  private readonly service = inject(IaValidacoesService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly usuarioInicial = this.auth.usuario()?.id;
  private readonly empresaInicial = this.auth.empresaIdAtual();
  private consulta?: Subscription;
  private readonly hoje = new Date();
  private readonly inicioPadrao = dataCalendarioLocal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1));
  private readonly fimPadrao = dataCalendarioLocal(new Date(this.hoje.getFullYear(), this.hoje.getMonth() + 1, 1));
  readonly form = inject(FormBuilder).nonNullable.group({ inicio: this.inicioPadrao, fim: this.fimPadrao });
  readonly dados = signal<IaValidacoes | null>(null);
  readonly carregando = signal(true);
  readonly pagina = signal(1);
  readonly tamanhoPagina = signal(10);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil((this.dados()?.total ?? 0) / this.tamanhoPagina())));
  readonly contextoValido = computed(() => this.auth.usuario()?.id === this.usuarioInicial && this.auth.empresaIdAtual() === this.empresaInicial && this.auth.temPermissao('ia_configuracoes:ler'));
  private periodoAplicado = { inicio: this.inicioPadrao, fim: this.fimPadrao };

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
    return ({ 1: 'Pendente', 2: 'Validada', 3: 'Recusada', 4: 'Indeterminada', 5: 'Conflito' } as Record<number, string>)[valor] ?? 'Desconhecido';
  }


  private carregar(): void {
    this.consulta?.unsubscribe();
    if (!this.contextoValido()) return;
    this.carregando.set(true);
    this.dados.set(null);
    this.consulta = this.service.listar(lerDataLocal(this.periodoAplicado.inicio)!.toISOString(), lerDataLocal(this.periodoAplicado.fim)!.toISOString(), this.pagina(), this.tamanhoPagina())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: resposta => {
          if (!this.contextoValido()) return;
          if (resposta.sucesso && resposta.dados) this.dados.set(resposta.dados);
          else this.toast.erro('Não foi possível consultar o histórico de validações.');
          this.carregando.set(false);
        },
        error: erro => {
          if (!this.contextoValido()) return;
          this.toast.erroServidor(erro, 'Não foi possível consultar o histórico de validações. Tente novamente.');
          this.carregando.set(false);
        }
      });
  }
}
