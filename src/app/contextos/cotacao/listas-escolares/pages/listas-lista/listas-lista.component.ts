import { ROTULO_STATUS_LISTA, StatusListaEscolar } from '../../models/lista-escolar-status';
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { ListasEscolaresService, ListaEscolarFiltro } from '../../services/listas-escolares.service';
import { ListaEscolarResumo } from '../../models/lista-escolar.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../../shared/components/select-busca/select-busca.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { BtnIconeComponent } from '../../../../../shared/components/btn-icone/btn-icone.component';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-listas-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ListagemPaginadaComponent, PageHeaderComponent, SelectBuscaComponent, ThOrdenavelComponent, BreadcrumbComponent, BtnIconeComponent],
  templateUrl: './listas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ListasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<ListaEscolarResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtro: ListaEscolarFiltro = {};
  escolaFiltro = signal<OpcaoSelectBusca | null>(null);
  serieFiltro = signal<OpcaoSelectBusca | null>(null);
  enviandoArquivo = signal(false);
  anosLetivos = signal<number[]>([]);

  buscarEscolas = (termo: string) =>
    this.listasService.buscarEscolasComCotacao(termo).pipe(map(res => res.dados ?? []));

  buscarSeries = (termo: string) =>
    this.listasService.buscarSeriesComCotacao(termo).pipe(map(res => res.dados ?? []));

  aoSelecionarEscolaFiltro(opcao: OpcaoSelectBusca | null) {
    this.escolaFiltro.set(opcao);
    this.filtro.idEscola = opcao?.id;
  }

  aoSelecionarSerieFiltro(opcao: OpcaoSelectBusca | null) {
    this.serieFiltro.set(opcao);
    this.filtro.idSerie = opcao?.id;
  }

  constructor(
    private listasService: ListasEscolaresService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.listasService.listarAnosLetivos().subscribe({
      next: res => {
        const anos = res.dados ?? [];
        this.anosLetivos.set(anos);
        this.filtro.anoLetivo = anos[0];
        this.carregar();
      },
      error: () => this.carregar()
    });
  }

  podeExcluirLista(): boolean {
    return this.auth.temPermissao('cotacoes:excluir');
  }

  async excluirLista(item: ListaEscolarResumo) {
    const identificacao = [item.escolaNome || 'Lista avulsa', item.serie, item.anoLetivo].filter(Boolean).join(' · ');
    const confirmado = await this.confirm.confirmar(
      `Excluir a lista "${identificacao}"?`,
      'Os itens, os vínculos com clientes e o PDF gerado serão apagados. Essa ação não pode ser desfeita.',
      { textoConfirmar: 'Excluir lista' }
    );
    if (!confirmado) return;

    this.listasService.excluirLista(item.id).subscribe({
      next: () => {
        this.toast.sucesso('Lista excluída.');
        const ultimaDaPagina = this.itens().length === 1 && this.paginaAtual() > 1;
        this.carregar(ultimaDaPagina ? this.paginaAtual() - 1 : this.paginaAtual());
        this.atualizarAnosLetivos();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível excluir a lista.')
    });
  }

  private atualizarAnosLetivos() {
    this.listasService.listarAnosLetivos().subscribe({
      next: res => this.anosLetivos.set(res.dados ?? [])
    });
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.listasService.listar({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as listas.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = { anoLetivo: this.anosLetivos()[0] };
    this.escolaFiltro.set(null);
    this.serieFiltro.set(null);
    this.ordenacaoAtual.set(null);
    this.carregar(1);
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.filtro.ordenarPor = ordenacao.campo;
    this.filtro.direcao = ordenacao.direcao;
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  aoSelecionarArquivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    this.enviarParaCotacao(arquivo, false, input);
  }

  private enviarParaCotacao(arquivo: File, substituir: boolean, input: HTMLInputElement) {
    this.enviandoArquivo.set(true);
    this.listasService.enviarArquivo(arquivo, substituir).subscribe({
      next: async res => {
        this.enviandoArquivo.set(false);

        if (res.dados?.status === 'existente_confirmar_substituicao') {
          const confirmado = await this.confirm.confirmar(
            'Já existe uma lista para essa escola, série e ano',
            'Substituir pela nova? A lista volta para conferência, os itens são refeitos e o PDF atual é apagado.',
            { textoConfirmar: 'Substituir' }
          );
          if (confirmado) {
            this.enviarParaCotacao(arquivo, true, input);
            return;
          }
          input.value = '';
          return;
        }

        this.toast.sucesso(substituir
          ? 'Lista substituída — voltou para conferência.'
          : 'Lista enviada pra Albia cotar — aparece na listagem assim que terminar.');
        input.value = '';
        this.atualizarAnosLetivos();
        this.carregar(1);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível enviar o arquivo.');
        this.enviandoArquivo.set(false);
        input.value = '';
      }
    });
  }

  readonly statusLista = StatusListaEscolar;

  readonly opcoesStatus = Object.values(StatusListaEscolar).filter((v): v is StatusListaEscolar => typeof v === 'number').map(v => ({ valor: v, rotulo: ROTULO_STATUS_LISTA[v] }));

  rotuloStatus(status: StatusListaEscolar): string {
    return ROTULO_STATUS_LISTA[status];
  }

  classeStatus(status: StatusListaEscolar): string {
    const mapa: Record<number, string> = {
      [StatusListaEscolar.Liberada]:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      [StatusListaEscolar.Liberando]:  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
      [StatusListaEscolar.Cotada]:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      [StatusListaEscolar.Existente]:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      [StatusListaEscolar.ReCotada]:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    };
    return mapa[status] ?? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }

  formatarReais(valor?: number): string {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
