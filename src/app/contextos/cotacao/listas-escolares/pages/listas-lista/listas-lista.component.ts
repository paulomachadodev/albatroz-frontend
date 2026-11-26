import { ROTULO_STATUS_LISTA, StatusListaEscolar } from '../../models/lista-escolar-status';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, map } from 'rxjs';
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

import { EnviarListaWhatsappComponent } from './enviar-lista-whatsapp.component';

type EstadoEnvio = 'fila' | 'enviando' | 'pronta' | 'duplicada' | 'erro';

interface ItemEnvio {
  arquivo: File;
  estado: EstadoEnvio;
  substituir: boolean;
  existente?: string;
}

@Component({
  selector: 'app-listas-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ListagemPaginadaComponent, PageHeaderComponent, SelectBuscaComponent, ThOrdenavelComponent, BreadcrumbComponent, BtnIconeComponent, EnviarListaWhatsappComponent],
  templateUrl: './listas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ListasListaComponent implements OnInit, OnDestroy {
  readonly listaParaEnviar = signal<ListaEscolarResumo | null>(null);

  podeEnviarPorWhatsapp(): boolean {
    return this.auth.temPermissao('cotacoes:editar');
  }

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
  envios = signal<ItemEnvio[]>([]);
  zonaTravada = signal(false);
  arrastandoSobreZona = signal(false);
  private intervaloAtualizacao?: ReturnType<typeof setInterval>;
  private static readonly INTERVALO_ATUALIZACAO_MS = 10000;
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
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const aviso = Number(this.route.snapshot.queryParamMap.get('aviso'));
    if (aviso === 1 || aviso === 2) this.filtro.aviso = aviso;
    this.intervaloAtualizacao = setInterval(() => this.recarregarSilencioso(), ListasListaComponent.INTERVALO_ATUALIZACAO_MS);
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

  ngOnDestroy() {
    if (this.intervaloAtualizacao) clearInterval(this.intervaloAtualizacao);
  }

  private recarregarSilencioso() {
    if (document.hidden || this.carregando()) return;
    this.listasService.listar({ pagina: this.paginaAtual(), tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
      }
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

  aoSelecionarArquivos(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivos = Array.from(input.files ?? []);
    input.value = '';
    this.receberArquivos(arquivos);
  }

  aoArrastarSobre(event: DragEvent) {
    event.preventDefault();
    if (!this.zonaTravada()) this.arrastandoSobreZona.set(true);
  }

  aoSairDaZona() {
    this.arrastandoSobreZona.set(false);
  }

  aoSoltar(event: DragEvent) {
    event.preventDefault();
    this.arrastandoSobreZona.set(false);
    this.receberArquivos(Array.from(event.dataTransfer?.files ?? []));
  }

  private receberArquivos(arquivos: File[]) {
    if (this.zonaTravada()) return;

    const aceitos = arquivos.filter(a => a.type.startsWith('image/') || a.type === 'application/pdf');
    if (aceitos.length < arquivos.length) {
      this.toast.aviso('Alguns arquivos foram ignorados', 'Só PDF e imagens são aceitos.');
    }
    if (aceitos.length === 0) return;

    this.envios.set(aceitos.map(arquivo => ({ arquivo, estado: 'fila' as const, substituir: false })));
    this.zonaTravada.set(true);
    this.toast.sucesso(
      `${aceitos.length} lista(s) enviada(s)`,
      'Estarão disponíveis na listagem assim que ficarem prontas. Pode continuar usando a tela.');
    void this.processarEnvios();
  }

  private async processarEnvios() {
    await this.processarFila();

    const duplicadas = this.envios().filter(e => e.estado === 'duplicada');
    if (duplicadas.length > 0) {
      const detalhes = duplicadas.map(e => `${e.arquivo.name} → já existe: ${e.existente ?? 'lista com mesma escola, série e ano'}`).join(' | ');
      const confirmado = await this.confirm.confirmar(
        `${duplicadas.length} lista(s) já existem para essa escola, série e ano`,
        `Substituir tudo? As listas voltam para conferência, os itens são refeitos e os PDFs atuais são apagados. ${detalhes}`,
        { textoConfirmar: 'Substituir tudo', textoCancelar: 'Cancelar' }
      );
      if (confirmado) {
        this.envios.update(lista => lista.map(e => e.estado === 'duplicada' ? { ...e, estado: 'fila' as const, substituir: true } : e));
        await this.processarFila();
      }
    }

    const prontas = this.envios().filter(e => e.estado === 'pronta').length;
    if (prontas > 0) this.toast.sucesso(`${prontas} lista(s) pronta(s) na listagem.`);

    this.envios.set([]);
    this.zonaTravada.set(false);
    this.atualizarAnosLetivos();
    this.recarregarSilencioso();
  }

  private async processarFila() {
    for (;;) {
      const proximo = this.envios().find(e => e.estado === 'fila');
      if (!proximo) return;

      this.definirEstadoEnvio(proximo.arquivo, 'enviando');
      try {
        const res = await firstValueFrom(this.listasService.enviarArquivo(proximo.arquivo, proximo.substituir));
        const duplicada = res.dados?.status === 'existente_confirmar_substituicao';
        this.definirEstadoEnvio(proximo.arquivo, duplicada ? 'duplicada' : 'pronta', res.dados?.listaExistente ?? undefined);
        if (!duplicada) this.recarregarSilencioso();
      } catch (err) {
        this.definirEstadoEnvio(proximo.arquivo, 'erro');
        this.toast.erroServidor(err, `Não foi possível enviar "${proximo.arquivo.name}". Confira a listagem antes de reenviar.`);
      }
    }
  }

  private definirEstadoEnvio(arquivo: File, estado: EstadoEnvio, existente?: string) {
    this.envios.update(lista => lista.map(e => e.arquivo === arquivo ? { ...e, estado, existente: existente ?? e.existente } : e));
  }

  rotuloEstadoEnvio(estado: EstadoEnvio): string {
    const rotulos: Record<EstadoEnvio, string> = {
      fila: 'Na fila', enviando: 'Cotando...', pronta: 'Pronta', duplicada: 'Já existe', erro: 'Erro'
    };
    return rotulos[estado];
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
