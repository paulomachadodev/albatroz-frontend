import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProdutosService } from '../../services/produtos.service';
import { MarcasService } from '../../services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';
import { ProdutoDetalhe, ProdutoFornecedor, ProdutoImagem, ListaPreco, ProdutoEnriquecimento, MarketplaceProduto, ProdutoAnalise } from '../../models/produto.model';
import { ProdutoEstoqueResposta } from '../../dtos/produto-resposta.dto';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { BtnIconeComponent } from '../../../../shared/components/btn-icone/btn-icone.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { OverlayProgressoComponent } from '../../../../shared/components/overlay-progresso/overlay-progresso.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { CampoHintComponent } from '../../../../shared/components/campo-hint/campo-hint.component';
import { GraficoBarrasComponent, DatasetGraficoBarras } from '../../../../shared/components/grafico-barras/grafico-barras.component';
import { ThemeService } from '../../../../core/theme/theme.service';

type Aba = 'geral' | 'complementos' | 'web' | 'preco' | 'fornecedores' | 'analise' | 'variacoes' | 'estoque';
type GranularidadeVendas = 'dia' | 'mes' | 'ano';
type SaidaEscolha = 'cancelar' | 'descartar' | 'salvar';

@Component({
  selector: 'app-produtos-detalhe',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, BtnIconeComponent, ListagemPaginadaComponent,
    SelectBuscaComponent, OverlayProgressoComponent, ModalComponent, ToggleComponent, CampoHintComponent,
    GraficoBarrasComponent
  ],
  templateUrl: './produtos-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosDetalheComponent implements OnInit {
  idProduto!: number;
  carregando = signal(true);
  produto = signal<ProdutoDetalhe | null>(null);
  abaAtiva = signal<Aba>('geral');

  // ---- Editar geral: só os campos ERP-owned ficam habilitados; o resto (Tiny) é
  // sempre somente-leitura. `sujo` cobre os campos de formulário (Complementos +
  // Web/enriquecimento) — Fornecedores/Preço já salvam de forma imediata por linha,
  // não entram no dirty-check.
  modoEdicao = signal(false);
  sujo = signal(false);
  modalSairAberto = signal(false);
  private resolverSaida?: (escolha: SaidaEscolha) => void;

  quantidadePorCaixa: number | null = null;
  salvandoDadosErp = signal(false);

  readonly maximoImagens = 8;
  readonly slotsImagens = [0, 1, 2, 3, 4, 5, 6, 7];

  enviandoImagem = signal(false);
  imagensConcluidas = signal(0);
  imagensTotal = signal(0);
  urlImagem = '';
  enviandoImagemPorUrl = signal(false);
  excluindoImagemId = signal<number | null>(null);
  imagemArrastadaId = signal<number | null>(null);
  salvandoOrdem = signal(false);
  slotArrastadoSobre = signal<number | null>(null);

  // ---- Fornecedores (produto_fornecedor_erp) ----
  salvandoFornecedorCodigo = signal<number | null>(null);
  removendoFornecedor = signal<number | null>(null);
  definindoPrincipal = signal<number | null>(null);
  codigoPorFornecedor: Record<number, string> = {};
  novoFornecedorSelecionado = signal<OpcaoSelectBusca | null>(null);
  novoFornecedorCodigo = '';
  novoFornecedorPrincipal = false;
  adicionandoFornecedor = signal(false);
  buscarFornecedores = (termo: string) => this.contatosService.buscar(termo, 'Fornecedor');

  // ---- Preço (listas — só leitura aqui; gestão fica em Configurações > Venda) ----
  listasPreco = signal<ListaPreco[]>([]);
  carregandoListas = signal(false);

  // ---- Web / enriquecimento ----
  enriquecimento = signal<ProdutoEnriquecimento | null>(null);
  carregandoEnriquecimento = signal(false);
  salvandoEnriquecimento = signal(false);
  reenriquecendo = signal(false);
  tagTexto = '';
  sinonimosTexto = '';
  publicoFaixaTexto = '';
  publicoGeneroTexto = '';
  categoriaGoogleSelecionada = signal<OpcaoSelectBusca | null>(null);
  buscarCategoriasGoogle = (termo: string) => this.produtosService.buscarCategoriasGoogle(termo);

  // ---- Marketplaces (Google/Meta/Site) — ação imediata, não entra no dirty-check ----
  marketplaces = signal<MarketplaceProduto[]>([]);
  carregandoMarketplaces = signal(false);
  alterandoMarketplace = signal<string | null>(null);

  // ---- Análise ----
  analise = signal<ProdutoAnalise | null>(null);
  carregandoAnalise = signal(false);
  granularidadeVendas = signal<GranularidadeVendas>('mes');

  estoque = signal<ProdutoEstoqueResposta | null>(null);
  carregandoEstoque = signal(false);
  paginaEstoque = signal(1);
  tamanhoPaginaEstoque = signal(10);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produtosService: ProdutosService,
    private marcasService: MarcasService,
    private contatosService: ContatosService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private theme: ThemeService
  ) {}

  ngOnInit() {
    // Rota é a mesma (":id") pra qualquer produto — Angular reaproveita a instância do
    // componente ao navegar entre eles (ex.: clicar numa variação/componente de kit),
    // então precisa reagir a paramMap (não só ler snapshot uma vez), senão a tela trava
    // mostrando os dados do produto anterior mesmo com a URL já trocada.
    this.route.paramMap.subscribe(params => {
      this.idProduto = Number(params.get('id'));
      this.resetarEstadoNavegacao();
      const abaQuery = this.route.snapshot.queryParamMap.get('aba') as Aba | null;
      this.abaAtiva.set(abaQuery ?? 'geral');
      this.origemCompras = this.route.snapshot.queryParamMap.get('origem') === 'compras';
      this.carregar();
    });
  }

  // Quando aberto a partir do relatório de Compras, "Voltar" retorna pra lá (o
  // filtro/página ficam preservados em ComprasService.estadoLista) em vez da
  // listagem geral de produtos.
  private origemCompras = false;

  private resetarEstadoNavegacao() {
    this.modoEdicao.set(false);
    this.sujo.set(false);
    this.estoque.set(null);
    this.paginaEstoque.set(1);
    this.listasPreco.set([]);
    this.enriquecimento.set(null);
    this.marketplaces.set([]);
    this.analise.set(null);
  }

  abrirSubProduto(id: number, aba?: Aba) {
    this.router.navigate(['/produtos', id], aba ? { queryParams: { aba } } : {});
  }

  carregar() {
    this.carregando.set(true);
    this.produtosService.obter(this.idProduto).subscribe({
      next: res => {
        const dados = res.dados ?? null;
        this.produto.set(dados);
        this.quantidadePorCaixa = dados?.quantidadePorCaixa ?? null;
        this.codigoPorFornecedor = {};
        (dados?.fornecedores ?? []).forEach(f => { this.codigoPorFornecedor[f.id] = f.codigoNoFornecedor ?? ''; });

        if (dados?.tipo === 'simples' && this.abaAtiva() === 'variacoes') {
          this.abaAtiva.set('geral');
        }
        if (this.abaAtiva() === 'estoque' && !this.estoque()) this.carregarEstoque();
        if (this.abaAtiva() === 'preco' && this.listasPreco().length === 0) this.carregarListasPreco();
        if (this.abaAtiva() === 'web' && !this.enriquecimento()) { this.carregarEnriquecimento(); this.carregarMarketplaces(); }

        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o produto.');
        this.carregando.set(false);
      }
    });
  }

  private recarregarSilencioso() {
    this.produtosService.obter(this.idProduto).subscribe({
      next: res => {
        this.produto.set(res.dados ?? null);
        this.codigoPorFornecedor = {};
        (res.dados?.fornecedores ?? []).forEach(f => { this.codigoPorFornecedor[f.id] = f.codigoNoFornecedor ?? ''; });
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível atualizar o produto.')
    });

    // Qualquer alteração no produto (preço, GTIN, categoria Google, imagem, situação) pode
    // mudar a elegibilidade pra marketplace/site — reavalia sempre que a aba já foi aberta
    // alguma vez nessa sessão (marketplaces() vazio = nunca carregou, nada a refrescar).
    if (this.marketplaces().length > 0) this.carregarMarketplaces();
  }

  trocarAba(aba: Aba) {
    this.abaAtiva.set(aba);
    this.router.navigate([], { relativeTo: this.route, queryParams: { aba }, queryParamsHandling: 'merge', replaceUrl: true });
    if (aba === 'preco' && this.listasPreco().length === 0) this.carregarListasPreco();
    if (aba === 'web' && !this.enriquecimento()) { this.carregarEnriquecimento(); this.carregarMarketplaces(); }
    if (aba === 'analise' && !this.analise()) this.carregarAnalise();
  }

  // ---- Editar geral + dirty-check de saída ----

  ativarEdicao() {
    this.modoEdicao.set(true);
  }

  marcarSujo() {
    if (this.modoEdicao()) this.sujo.set(true);
  }

  async voltar() {
    if (this.modoEdicao() && this.sujo()) {
      const escolha = await this.pedirEscolhaSaida();
      if (escolha === 'cancelar') return;
      if (escolha === 'salvar') {
        const ok = await this.salvarTudo();
        if (!ok) return;
      } else {
        this.modoEdicao.set(false);
        this.sujo.set(false);
        this.carregar();
      }
    }
    this.router.navigate([this.origemCompras ? '/compras' : '/produtos']);
  }

  async finalizarEdicao() {
    if (!this.sujo()) { this.modoEdicao.set(false); return; }

    const escolha = await this.pedirEscolhaSaida();
    if (escolha === 'cancelar') return;
    if (escolha === 'salvar') {
      await this.salvarTudo();
    } else {
      this.modoEdicao.set(false);
      this.sujo.set(false);
      this.carregar();
    }
  }

  private pedirEscolhaSaida(): Promise<SaidaEscolha> {
    this.modalSairAberto.set(true);
    return new Promise(resolve => (this.resolverSaida = resolve));
  }

  responderSaida(escolha: SaidaEscolha) {
    this.modalSairAberto.set(false);
    this.resolverSaida?.(escolha);
    this.resolverSaida = undefined;
  }

  private async salvarTudo(): Promise<boolean> {
    const okDados = await this.salvarDadosErpAsync();
    const okEnriquecimento = await this.salvarEnriquecimentoAsync();
    const okFornecedores = await this.salvarCodigosFornecedorAsync();
    if (okDados && okEnriquecimento && okFornecedores) {
      this.sujo.set(false);
      this.modoEdicao.set(false);
      this.toast.sucesso('Alterações salvas.');
      this.recarregarSilencioso();
      return true;
    }
    return false;
  }

  rotuloTipo(tipo: string): string {
    const mapa: Record<string, string> = { simples: 'Simples', kit: 'Kit', variacao: 'Variação' };
    return mapa[tipo] ?? tipo;
  }

  rotuloSituacao(situacao: string): string {
    const mapa: Record<string, string> = { A: 'Ativo', I: 'Inativo', E: 'Excluído' };
    return mapa[situacao] ?? situacao;
  }

  // ---- Aba Complementos ----

  private salvarDadosErpAsync(): Promise<boolean> {
    return new Promise(resolve => {
      this.salvandoDadosErp.set(true);
      this.produtosService.atualizarDadosErp(this.idProduto, { quantidadePorCaixa: this.quantidadePorCaixa }).subscribe({
        next: () => { this.salvandoDadosErp.set(false); resolve(true); },
        error: err => {
          this.salvandoDadosErp.set(false);
          this.toast.erroServidor(err, 'Não foi possível salvar a quantidade por caixa.');
          resolve(false);
        }
      });
    });
  }


  // ---- Aba Web — Imagens ----

  imagemNoSlot(slot: number): ProdutoImagem | null {
    return this.produto()?.imagens?.find(i => i.indice === slot + 1) ?? null;
  }

  private maiorIndiceOcupado(): number {
    const imagens = this.produto()?.imagens ?? [];
    return imagens.reduce((max, i) => Math.max(max, i.indice), 0);
  }

  slotBloqueado(slot: number): boolean {
    return slot > this.maiorIndiceOcupado();
  }

  slotAceitaDrop(slot: number): boolean {
    return slot <= this.maiorIndiceOcupado();
  }

  private vagasContiguasApartirDoSlot(slot: number): number {
    let vagas = 0;
    for (let s = slot; s < this.maximoImagens; s++) {
      if (this.imagemNoSlot(s)) break;
      vagas++;
    }
    return vagas;
  }

  aoSelecionarArquivosSlot(event: Event, slot: number) {
    const input = event.target as HTMLInputElement;
    const arquivos = input.files;
    if (arquivos && arquivos.length > 0) this.processarArquivosNoSlot(Array.from(arquivos), slot);
    input.value = '';
  }

  aoArrastarSobreSlot(event: DragEvent, slot: number) {
    if (!this.slotAceitaDrop(slot)) return;
    event.preventDefault();
    this.slotArrastadoSobre.set(slot);
  }

  aoSairDoSlot() {
    this.slotArrastadoSobre.set(null);
  }

  aoSoltarNoSlot(event: DragEvent, slot: number) {
    this.slotArrastadoSobre.set(null);
    if (!this.slotAceitaDrop(slot)) return;
    event.preventDefault();

    const arquivos = event.dataTransfer?.files;
    if (arquivos && arquivos.length > 0) {
      this.processarArquivosNoSlot(Array.from(arquivos), slot);
      return;
    }

    const imagemAlvo = this.imagemNoSlot(slot);
    if (imagemAlvo) this.aoSoltarImagemSobre(imagemAlvo);
  }

  private processarArquivosNoSlot(arquivos: File[], slot: number) {
    const imagens = arquivos.filter(a => a.type.startsWith('image/'));
    if (imagens.length === 0) {
      this.toast.erro('Selecione apenas arquivos de imagem.');
      return;
    }

    const existente = this.imagemNoSlot(slot);
    if (existente) {
      if (imagens.length > 1) {
        this.toast.erro('Só a 1ª imagem foi usada pra substituir — solte as demais num quadrado vazio.');
      }
      this.substituirImagem(existente, imagens[0]);
      return;
    }

    const vagas = this.vagasContiguasApartirDoSlot(slot);
    const aEnviar = imagens.slice(0, vagas);
    if (imagens.length > aEnviar.length) {
      this.toast.erro(`${imagens.length - aEnviar.length} imagem(ns) não coube(ram) — máximo de ${this.maximoImagens} por produto.`);
    }
    if (aEnviar.length === 0) return;

    this.enviandoImagem.set(true);
    this.imagensConcluidas.set(0);
    this.imagensTotal.set(aEnviar.length);
    this.enviarSequencial(aEnviar, slot + 1, 0);
  }

  private enviarSequencial(arquivos: File[], indiceInicial: number, i: number) {
    if (i >= arquivos.length) {
      this.enviandoImagem.set(false);
      this.toast.sucesso(arquivos.length > 1 ? 'Imagens enviadas.' : 'Imagem enviada.');
      this.recarregarSilencioso();
      return;
    }

    this.produtosService.uploadImagem(this.idProduto, arquivos[i], indiceInicial + i).subscribe({
      next: () => {
        this.imagensConcluidas.set(i + 1);
        this.enviarSequencial(arquivos, indiceInicial, i + 1);
      },
      error: err => {
        this.enviandoImagem.set(false);
        this.toast.erroServidor(err, 'Não foi possível enviar a imagem.');
        this.recarregarSilencioso();
      }
    });
  }

  // Sempre vai pro próximo slot livre — sem seletor de posição, mesmo comportamento do
  // drag-and-drop de arquivo. Backend baixa a URL, converte pra WebP e sobe pro R2.
  enviarPorUrl() {
    const url = this.urlImagem.trim();
    if (!url) return;

    const totalAtual = this.produto()?.imagens.length ?? 0;
    if (totalAtual >= this.maximoImagens) {
      this.toast.erro(`Produto já atingiu o máximo de ${this.maximoImagens} imagens.`);
      return;
    }

    this.enviandoImagemPorUrl.set(true);
    this.produtosService.uploadImagemPorUrl(this.idProduto, url).subscribe({
      next: () => {
        this.enviandoImagemPorUrl.set(false);
        this.urlImagem = '';
        this.toast.sucesso('Imagem enviada.');
        this.recarregarSilencioso();
      },
      error: err => {
        this.enviandoImagemPorUrl.set(false);
        this.toast.erroServidor(err, 'Não foi possível baixar a imagem dessa URL.');
      }
    });
  }

  private substituirImagem(existente: ProdutoImagem, arquivo: File) {
    this.enviandoImagem.set(true);
    this.imagensConcluidas.set(0);
    this.imagensTotal.set(1);
    this.produtosService.excluirImagem(this.idProduto, existente.id).subscribe({
      next: () => {
        this.produtosService.uploadImagem(this.idProduto, arquivo, existente.indice).subscribe({
          next: () => {
            this.imagensConcluidas.set(1);
            this.enviandoImagem.set(false);
            this.toast.sucesso('Imagem substituída.');
            this.recarregarSilencioso();
          },
          error: err => {
            this.enviandoImagem.set(false);
            this.toast.erroServidor(err, 'Imagem antiga foi removida, mas o envio da nova falhou — solte outra nesse quadrado.');
            this.recarregarSilencioso();
          }
        });
      },
      error: err => {
        this.enviandoImagem.set(false);
        this.toast.erroServidor(err, 'Não foi possível substituir a imagem.');
      }
    });
  }

  async excluirImagem(imagem: ProdutoImagem) {
    const confirmado = await this.confirm.confirmar(
      'Excluir essa imagem?',
      'A imagem é removida definitivamente do produto e não pode ser recuperada.',
      { textoConfirmar: 'Excluir' }
    );
    if (!confirmado) return;

    this.excluindoImagemId.set(imagem.id);
    this.produtosService.excluirImagem(this.idProduto, imagem.id).subscribe({
      next: () => {
        this.excluindoImagemId.set(null);
        this.toast.sucesso('Imagem excluída.');
        this.recarregarSilencioso();
      },
      error: err => {
        this.excluindoImagemId.set(null);
        this.toast.erroServidor(err, 'Não foi possível excluir a imagem.');
      }
    });
  }

  async excluirTodasImagens() {
    const confirmado = await this.confirm.confirmar(
      'Excluir todas as imagens deste produto?',
      undefined,
      { textoConfirmar: 'Excluir' }
    );
    if (!confirmado) return;

    this.produtosService.excluirTodasImagens(this.idProduto).subscribe({
      next: () => {
        this.toast.sucesso('Imagens excluídas.');
        this.recarregarSilencioso();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível excluir as imagens do produto.')
    });
  }

  aoIniciarArrasteImagem(imagem: ProdutoImagem) {
    this.imagemArrastadaId.set(imagem.id);
  }

  aoTerminarArrasteImagem() {
    this.imagemArrastadaId.set(null);
  }

  aoArrastarImagemSobre(event: DragEvent) {
    event.preventDefault();
  }

  aoSoltarImagemSobre(imagemAlvo: ProdutoImagem) {
    const origemId = this.imagemArrastadaId();
    this.imagemArrastadaId.set(null);
    if (origemId == null || origemId === imagemAlvo.id) return;

    const produtoAtual = this.produto();
    if (!produtoAtual) return;

    const imagens = [...produtoAtual.imagens];
    const indiceOrigem = imagens.findIndex(i => i.id === origemId);
    const indiceAlvo = imagens.findIndex(i => i.id === imagemAlvo.id);
    if (indiceOrigem < 0 || indiceAlvo < 0) return;

    const [movida] = imagens.splice(indiceOrigem, 1);
    imagens.splice(indiceAlvo, 0, movida);

    this.produto.set({ ...produtoAtual, imagens });
    this.salvarOrdemImagens(imagens.map(i => i.id));
  }

  private salvarOrdemImagens(imagemIds: number[]) {
    this.salvandoOrdem.set(true);
    this.produtosService.reordenarImagens(this.idProduto, { imagemIds }).subscribe({
      next: () => {
        this.salvandoOrdem.set(false);
        this.recarregarSilencioso();
      },
      error: err => {
        this.salvandoOrdem.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar a nova ordem das imagens.');
        this.recarregarSilencioso();
      }
    });
  }

  // ---- Aba Web — Enriquecimento (SEO/Google/Tags) ----

  carregarEnriquecimento() {
    this.carregandoEnriquecimento.set(true);
    this.produtosService.obterEnriquecimento(this.idProduto).subscribe({
      next: res => {
        const e = res.dados ?? null;
        this.enriquecimento.set(e);
        this.tagTexto = (e?.tag ?? []).join(', ');
        this.sinonimosTexto = (e?.sinonimos ?? []).join(', ');
        this.publicoFaixaTexto = (e?.publicoFaixa ?? []).join(', ');
        this.publicoGeneroTexto = (e?.publicoGenero ?? []).join(', ');
        this.categoriaGoogleSelecionada.set(e?.googleProductCategory ? { id: 0, nome: e.googleProductCategory } : null);
        this.carregandoEnriquecimento.set(false);
      },
      error: err => {
        this.carregandoEnriquecimento.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar os dados de SEO/enriquecimento.');
      }
    });
  }

  aoSelecionarCategoriaGoogle(opcao: OpcaoSelectBusca | null) {
    this.categoriaGoogleSelecionada.set(opcao);
    const e = this.enriquecimento();
    if (e) e.googleProductCategory = opcao ? String(opcao.nome) : undefined;
    this.marcarSujo();
  }

  private listaTexto(texto: string): string[] {
    return texto.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  private salvarEnriquecimentoAsync(): Promise<boolean> {
    const e = this.enriquecimento();
    if (!e) return Promise.resolve(true);

    return new Promise(resolve => {
      this.salvandoEnriquecimento.set(true);
      this.produtosService.atualizarEnriquecimento(this.idProduto, {
        seoTitle: e.seoTitle ?? null,
        seoDescription: e.seoDescription ?? null,
        seoSlug: e.seoSlug ?? null,
        googleProductCategory: e.googleProductCategory ?? null,
        googleBrand: e.googleBrand ?? null,
        googleGtin: e.googleGtin ?? null,
        condicao: e.condicao ?? null,
        tag: this.listaTexto(this.tagTexto),
        sinonimos: this.listaTexto(this.sinonimosTexto),
        descricaoEnriquecida: e.descricaoEnriquecida ?? null,
        descricaoLonga: e.descricaoLonga ?? null,
        descricaoUso: e.descricaoUso ?? null,
        publicoFaixa: this.listaTexto(this.publicoFaixaTexto),
        publicoGenero: this.listaTexto(this.publicoGeneroTexto),
        cor: e.cor ?? null,
        tamanho: e.tamanho ?? null,
        material: e.material ?? null
      }).subscribe({
        next: () => { this.salvandoEnriquecimento.set(false); resolve(true); },
        error: err => {
          this.salvandoEnriquecimento.set(false);
          this.toast.erroServidor(err, 'Não foi possível salvar os dados de SEO/enriquecimento.');
          resolve(false);
        }
      });
    });
  }

  async reenriquecerViaIa() {
    const confirmado = await this.confirm.confirmar(
      'Reenriquecer via IA?',
      'A IA vai gerar de novo SEO, Google Shopping, tags, sinônimos e descrições desse produto — os valores atuais desses campos serão apagados e substituídos. O embedding de busca também é regenerado automaticamente ao final.',
      { textoConfirmar: 'Reenriquecer' }
    );
    if (!confirmado) return;

    this.reenriquecendo.set(true);
    this.produtosService.reenriquecer(this.idProduto).subscribe({
      next: () => {
        this.reenriquecendo.set(false);
        this.toast.sucesso('Produto reenriquecido pela IA.');
        this.carregarEnriquecimento();
        if (this.marketplaces().length > 0) this.carregarMarketplaces();
      },
      error: err => {
        this.reenriquecendo.set(false);
        this.toast.erroServidor(err, 'Não foi possível reenriquecer agora — tente novamente em instantes.');
      }
    });
  }

  carregarMarketplaces() {
    this.carregandoMarketplaces.set(true);
    this.produtosService.listarMarketplaces(this.idProduto).subscribe({
      next: res => { this.marketplaces.set(res.dados ?? []); this.carregandoMarketplaces.set(false); },
      error: err => { this.carregandoMarketplaces.set(false); this.toast.erroServidor(err, 'Não foi possível carregar os marketplaces.'); }
    });
  }

  alternarMarketplace(marketplace: MarketplaceProduto) {
    this.alterandoMarketplace.set(marketplace.codigo);
    this.produtosService.definirMarketplace(this.idProduto, marketplace.codigo, !marketplace.habilitado).subscribe({
      next: () => { this.alterandoMarketplace.set(null); this.carregarMarketplaces(); },
      error: err => { this.alterandoMarketplace.set(null); this.toast.erroServidor(err, 'Não foi possível atualizar o marketplace.'); }
    });
  }

  // ---- Aba Análise ----

  carregarAnalise() {
    this.carregandoAnalise.set(true);
    this.produtosService.obterAnalise(this.idProduto).subscribe({
      next: res => { this.analise.set(res.dados ?? null); this.carregandoAnalise.set(false); },
      error: err => { this.carregandoAnalise.set(false); this.toast.erroServidor(err, 'Não foi possível carregar a análise do produto.'); }
    });
  }

  rotuloMes(mes: number): string {
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return nomes[mes - 1] ?? String(mes);
  }

  barrasVendas = computed<{ rotulo: string; valor: number }[]>(() => {
    const a = this.analise();
    if (!a) return [];
    if (this.granularidadeVendas() === 'dia') {
      return a.vendasPorDia.map(v => ({ rotulo: v.data.slice(8, 10) + '/' + v.data.slice(5, 7), valor: v.quantidade }));
    }
    if (this.granularidadeVendas() === 'ano') {
      return a.vendasPorAno.map(v => ({ rotulo: String(v.ano), valor: v.quantidade }));
    }
    return a.vendasPorMes.map(v => ({ rotulo: `${this.rotuloMes(v.mes)}/${String(v.ano).slice(2)}`, valor: v.quantidade }));
  });

  chartLabelsVendas = computed(() => this.barrasVendas().map(b => b.rotulo));

  chartDatasetsVendas = computed<DatasetGraficoBarras[]>(() => [
    { label: 'Quantidade', data: this.barrasVendas().map(b => b.valor), color: '#1754cf' }
  ]);

  barrasFaturamentoLucro = computed<{ rotulo: string; faturamento: number; lucro: number }[]>(() => {
    const a = this.analise();
    if (!a) return [];
    return a.vendasPorMes.map(v => ({ rotulo: `${this.rotuloMes(v.mes)}/${String(v.ano).slice(2)}`, faturamento: v.faturamento, lucro: v.lucro }));
  });

  chartLabelsFaturamentoLucro = computed(() => this.barrasFaturamentoLucro().map(b => b.rotulo));

  chartDatasetsFaturamentoLucro = computed<DatasetGraficoBarras[]>(() => [
    { label: 'Faturamento', data: this.barrasFaturamentoLucro().map(b => b.faturamento), color: '#1754cf' },
    { label: 'Lucro bruto', data: this.barrasFaturamentoLucro().map(b => b.lucro), color: '#10b981' }
  ]);

  barrasComparativoAnual = computed<{ rotulo: string; anoAtual: number; anoAnterior: number }[]>(() => {
    const a = this.analise();
    if (!a) return [];
    const anoAtual = new Date().getFullYear();
    const anoAnterior = anoAtual - 1;
    const porMes = a.vendasPorMes;

    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const atual = porMes.find(v => v.ano === anoAtual && v.mes === mes)?.faturamento ?? 0;
      const anterior = porMes.find(v => v.ano === anoAnterior && v.mes === mes)?.faturamento ?? 0;
      return { rotulo: this.rotuloMes(mes), anoAtual: atual, anoAnterior: anterior };
    }).filter(b => b.anoAtual > 0 || b.anoAnterior > 0);
  });

  chartLabelsComparativo = computed(() => this.barrasComparativoAnual().map(b => b.rotulo));

  chartDatasetsComparativo = computed<DatasetGraficoBarras[]>(() => {
    const corAnoAnterior = this.theme.temaAtual() === 'dark' ? '#475569' : '#cbd5e1';
    return [
      { label: 'Ano anterior', data: this.barrasComparativoAnual().map(b => b.anoAnterior), color: corAnoAnterior },
      { label: 'Ano atual', data: this.barrasComparativoAnual().map(b => b.anoAtual), color: '#1754cf' }
    ];
  });

  formatarReaisCompacto(valor?: number): string {
    if (!valor) return 'R$0';
    if (valor >= 1000) return `R$${(valor / 1000).toFixed(1)}k`;
    return `R$${Math.round(valor)}`;
  }

  // ---- Aba Preço ----

  carregarListasPreco() {
    this.carregandoListas.set(true);
    this.produtosService.listarListasPreco().subscribe({
      next: res => { this.listasPreco.set(res.dados ?? []); this.carregandoListas.set(false); },
      error: err => { this.carregandoListas.set(false); this.toast.erroServidor(err, 'Não foi possível carregar as listas de preço.'); }
    });
  }

  precoPorLista(idLista: number) {
    return this.produto()?.precos.find(p => p.idLista === idLista) ?? null;
  }

  // ---- Aba Estoque ----

  abrirAbaEstoque() {
    this.trocarAba('estoque');
    if (!this.estoque()) this.carregarEstoque();
  }

  carregarEstoque() {
    this.carregandoEstoque.set(true);
    this.produtosService.obterEstoque(this.idProduto, this.paginaEstoque(), this.tamanhoPaginaEstoque()).subscribe({
      next: res => {
        this.estoque.set(res.dados ?? null);
        this.carregandoEstoque.set(false);
      },
      error: err => {
        this.carregandoEstoque.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar o estoque.');
      }
    });
  }

  aoMudarPaginaEstoque(pagina: number) {
    this.paginaEstoque.set(pagina);
    this.carregarEstoque();
  }

  aoMudarTamanhoPaginaEstoque(tamanho: number) {
    this.tamanhoPaginaEstoque.set(tamanho);
    this.paginaEstoque.set(1);
    this.carregarEstoque();
  }

  rotuloOrigemEstoque(origem?: string): string {
    const mapa: Record<string, string> = { venda: 'Venda', compra: 'Compra', ajuste: 'Ajuste', devolucao: 'Devolução' };
    return origem ? (mapa[origem] ?? origem) : '-';
  }

  // ---- Aba Fornecedores (produto_fornecedor_erp) ----

  aoSelecionarNovoFornecedor(opcao: OpcaoSelectBusca | null) {
    this.novoFornecedorSelecionado.set(opcao);
  }

  adicionarFornecedor() {
    const opcao = this.novoFornecedorSelecionado();
    if (!opcao) { this.toast.erro('Busque e selecione um fornecedor.'); return; }

    this.adicionandoFornecedor.set(true);
    this.produtosService.adicionarFornecedor(this.idProduto, {
      idContato: opcao.id, codigoNoFornecedor: this.novoFornecedorCodigo.trim() || null, principal: this.novoFornecedorPrincipal
    }).subscribe({
      next: () => {
        this.adicionandoFornecedor.set(false);
        this.novoFornecedorSelecionado.set(null);
        this.novoFornecedorCodigo = '';
        this.novoFornecedorPrincipal = false;
        this.toast.sucesso('Fornecedor adicionado.');
        this.recarregarSilencioso();
      },
      error: err => { this.adicionandoFornecedor.set(false); this.toast.erroServidor(err, 'Não foi possível adicionar o fornecedor.'); }
    });
  }

  // Código no fornecedor é campo de formulário (não ação de lista) — entra no
  // dirty-check e só grava junto com o resto no "Concluir edição" (salvarTudo).
  private codigosFornecedorPendentes = new Set<number>();

  aoMudarCodigoFornecedor(idFornecedorErp: number) {
    this.codigosFornecedorPendentes.add(idFornecedorErp);
    this.marcarSujo();
  }

  private async salvarCodigosFornecedorAsync(): Promise<boolean> {
    if (this.codigosFornecedorPendentes.size === 0) return true;

    this.salvandoFornecedorCodigo.set(-1);
    const ids = Array.from(this.codigosFornecedorPendentes);
    try {
      await Promise.all(ids.map(id => {
        const valor = (this.codigoPorFornecedor[id] ?? '').trim();
        return firstValueFrom(this.produtosService.atualizarFornecedor(this.idProduto, id, { codigoNoFornecedor: valor || null }));
      }));
      this.codigosFornecedorPendentes.clear();
      this.salvandoFornecedorCodigo.set(null);
      return true;
    } catch (err) {
      this.salvandoFornecedorCodigo.set(null);
      this.toast.erroServidor(err, 'Não foi possível salvar o código de um dos fornecedores.');
      return false;
    }
  }

  definirPrincipal(fornecedor: ProdutoFornecedor) {
    if (fornecedor.principal) return;
    this.definindoPrincipal.set(fornecedor.id);
    this.produtosService.definirFornecedorPrincipal(this.idProduto, fornecedor.id).subscribe({
      next: () => { this.definindoPrincipal.set(null); this.toast.sucesso('Fornecedor principal atualizado.'); this.recarregarSilencioso(); },
      error: err => { this.definindoPrincipal.set(null); this.toast.erroServidor(err, 'Não foi possível definir como principal.'); }
    });
  }

  async removerFornecedor(fornecedor: ProdutoFornecedor) {
    const confirmado = await this.confirm.confirmar(
      'Remover esse fornecedor do produto?',
      `${fornecedor.nomeFornecedor} deixa de aparecer vinculado a esse produto.`,
      { textoConfirmar: 'Remover' }
    );
    if (!confirmado) return;

    this.removendoFornecedor.set(fornecedor.id);
    this.produtosService.removerFornecedor(this.idProduto, fornecedor.id).subscribe({
      next: () => { this.removendoFornecedor.set(null); this.toast.sucesso('Fornecedor removido.'); this.recarregarSilencioso(); },
      error: err => { this.removendoFornecedor.set(null); this.toast.erroServidor(err, 'Não foi possível remover o fornecedor.'); }
    });
  }

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarNumero(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR');
  }
}
