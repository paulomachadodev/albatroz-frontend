import { dataCalendarioLocal, lerDataLocal } from '../../../../../shared/utils/data-local.util';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';
import { ThemeService } from '../../../../../core/theme/theme.service';
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
import { IaConsumo, IaConsumoFiltro, IaConsumoGrupo } from '../../models/ia-consumo.model';

@Component({
  selector: 'app-ia-consumo',
  standalone: true,
  imports: [ChartModule, DatePipe, DecimalPipe, ReactiveFormsModule, InputTextModule, SelectModule, BreadcrumbComponent, PageHeaderComponent, ListagemPaginadaComponent],
  templateUrl: './ia-consumo.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class IaConsumoComponent {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private exportacaoId = 0;
  private readonly service = inject(IaConsumoService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly usuarioInicial = this.auth.usuario()?.id;
  private readonly empresaInicial = this.auth.empresaIdAtual();
  private consulta?: Subscription;
  private exportacao?: Subscription;
  readonly exportando = signal(false);
  readonly fusoHorario = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  readonly podeExportar = computed(() => this.contextoValido() && this.auth.temPermissao('ia_consumo:exportar'));
  private readonly hoje = new Date();
  private readonly inicioPadrao = dataCalendarioLocal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1));
  private readonly fimPadrao = dataCalendarioLocal(new Date(this.hoje.getFullYear(), this.hoje.getMonth() + 1, 1));
  readonly form = inject(FormBuilder).nonNullable.group({ inicio: this.inicioPadrao, fim: this.fimPadrao, finalidade: '', modelo: '', status: 0, modulo: '', provedor: '' });
  readonly dados = signal<IaConsumo | null>(null);
  readonly coberturaTexto = computed(() => {
    switch (this.dados()?.cobertura) {
      case 'validacao_google': return 'Cobertura: somente validações da chave Google.';
      case 'fluxos_google': return 'Cobertura: validações da chave e fluxos Google instrumentados.';
      default: return 'Cobertura não informada.';
    }
  });
  readonly carregando = signal(true);
  readonly pagina = signal(1);
  readonly tamanhoPagina = signal(10);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil((this.dados()?.total ?? 0) / this.tamanhoPagina())));
  readonly contextoValido = computed(() => this.auth.usuario()?.id === this.usuarioInicial && this.auth.empresaIdAtual() === this.empresaInicial && this.auth.temPermissao('ia_consumo:ler'));
  private periodoAplicado = this.form.getRawValue();
  readonly finalidades = [
    { rotulo: 'Todas', valor: '' }, { rotulo: 'Validação Google', valor: 'validacao_google' },
    { rotulo: 'Lista escolar', valor: 'lista_escolar' }, { rotulo: 'Fatura', valor: 'fatura' },
    { rotulo: 'Classificação de produto', valor: 'classificacao_produto' }, { rotulo: 'Descrição de produto', valor: 'descricao_produto' },
    { rotulo: 'Tendência de volta às aulas', valor: 'tendencia_volta_aulas' }, { rotulo: 'Embedding', valor: 'embedding' }
  ];
  readonly resultados = [{ rotulo: 'Todos', valor: 0 }, { rotulo: 'Pendente', valor: 1 }, { rotulo: 'Sucesso', valor: 2 }, { rotulo: 'Falha', valor: 3 }, { rotulo: 'Indeterminada', valor: 4 }];
  readonly selectPt = {
    root: 'relative block w-full',
    label: 'block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap',
    dropdown: 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400',
    overlay: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50',
    list: 'py-1', option: 'px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'
  };

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelarExportacao());
    effect(() => {
      if (!this.contextoValido()) {
        this.consulta?.unsubscribe();
        this.cancelarExportacao();
        this.dados.set(null);
        this.carregando.set(false);
        void this.router.navigate(['/configuracoes'], { replaceUrl: true });
      }
    });
    effect(() => {
      if (!this.podeExportar()) {
        this.cancelarExportacao();
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


  readonly graficoDiario = computed<ChartData<'bar'>>(() => ({
    labels: (this.dados()?.painel?.dias ?? []).map(dia => this.diaLocal(dia.data)),
    datasets: [{ label: 'Custo calculado (USD)', data: (this.dados()?.painel?.dias ?? []).map(dia => dia.custoUsd), backgroundColor: contexto => getComputedStyle(contexto.chart.canvas).color, borderRadius: 4 }]
  }));
  readonly graficoFinalidades = computed(() => this.graficoGrupos(this.dados()?.painel?.finalidades ?? []));
  readonly graficoModelos = computed(() => this.graficoGrupos(this.dados()?.painel?.modelos ?? []));
  readonly opcoesGrafico = computed<ChartOptions<'bar'>>(() => {
    const cor = this.theme.temaAtual() === 'dark' ? '#cbd5e1' : '#475569';
    return {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: contexto => this.custo(typeof contexto.raw === 'number' ? contexto.raw : null) } } },
    scales: { y: { beginAtZero: true, ticks: { color: cor, callback: valor => this.custo(Number(valor)) } }, x: { ticks: { color: cor, autoSkip: true, maxRotation: 0 } } }
    };
  });

  diaLocal(valor: string): string {
    const partes = valor.split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : valor;
  }

  nomeFinalidade(valor: string): string {
    return this.finalidades.find(finalidade => finalidade.valor === valor)?.rotulo ?? valor;
  }

  private graficoGrupos(grupos: IaConsumoGrupo[]): ChartData<'bar'> {
    return { labels: grupos.map(grupo => this.nomeFinalidade(grupo.nome)), datasets: [{ label: 'Custo calculado (USD)', data: grupos.map(grupo => grupo.custoUsd), backgroundColor: contexto => getComputedStyle(contexto.chart.canvas).color, borderRadius: 4 }] };
  }

  private filtroAplicado(): IaConsumoFiltro {
    const periodo = this.periodoAplicado;
    return {
      inicio: lerDataLocal(periodo.inicio)!.toISOString(), fim: lerDataLocal(periodo.fim)!.toISOString(),
      pagina: this.pagina(), tamanhoPagina: this.tamanhoPagina(), fusoHorario: this.fusoHorario,
      ...(periodo.finalidade && { finalidade: periodo.finalidade }),
      ...(periodo.modelo.trim() && { modelo: periodo.modelo.trim() }),
      ...(periodo.modulo.trim() && { modulo: periodo.modulo.trim() }),
      ...(periodo.provedor.trim() && { provedor: periodo.provedor.trim() }),
      ...(periodo.status && { status: periodo.status })
    };
  }

  exportar(): void {
    if (!this.podeExportar() || this.exportando() || !this.dados()?.habilitado) return;
    const exportacaoId = ++this.exportacaoId;
    const periodo = { ...this.periodoAplicado };
    this.exportando.set(true);
    this.exportacao = this.service.exportar(this.filtroAplicado()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: arquivo => {
        if (!this.podeExportar() || exportacaoId !== this.exportacaoId) return;
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'consumo-ia-' + periodo.inicio + '-' + periodo.fim + '.csv';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        this.exportando.set(false);
      },
      error: erro => { void this.erroExportacao(erro, exportacaoId); }
    });
  }

  private async erroExportacao(erro: unknown, exportacaoId: number): Promise<void> {
    let erroNormalizado = erro;
    if (erro instanceof HttpErrorResponse && erro.error instanceof Blob) {
      try {
        const corpo: unknown = JSON.parse(await erro.error.text());
        erroNormalizado = new HttpErrorResponse({ error: corpo, status: erro.status, statusText: erro.statusText });
      } catch {
        erroNormalizado = null;
      }
    }
    if (!this.podeExportar() || exportacaoId !== this.exportacaoId) return;
    this.exportando.set(false);
    this.toast.erroServidor(erroNormalizado, 'Não foi possível exportar. Reduza o período ou os filtros e tente novamente.');
  }

  private cancelarExportacao(): void {
    this.exportacaoId++;
    this.exportacao?.unsubscribe();
    this.exportando.set(false);
  }

  private carregar(): void {
    this.cancelarExportacao();
    this.consulta?.unsubscribe();
    if (!this.contextoValido()) return;
    this.carregando.set(true);
    this.dados.set(null);
    this.consulta = this.service.listar(this.filtroAplicado())
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
