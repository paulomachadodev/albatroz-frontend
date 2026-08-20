import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProdutosService } from '../../services/produtos.service';
import { MarcasService } from '../../services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';
import { ProdutoDetalhe, ProdutoFornecedor, ProdutoImagem, ListaPreco, ProdutoEnriquecimento } from '../../models/produto.model';
import { ProdutoEstoqueResposta } from '../../dtos/produto-resposta.dto';
import { CriarListaPrecoRequisicao, AtualizarListaPrecoRequisicao } from '../../dtos/produto-requisicao.dto';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { BtnIconeComponent } from '../../../../shared/components/btn-icone/btn-icone.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { OverlayProgressoComponent } from '../../../../shared/components/overlay-progresso/overlay-progresso.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

type Aba = 'geral' | 'complementos' | 'web' | 'preco' | 'fornecedores' | 'variacoes' | 'estoque';
type SaidaEscolha = 'cancelar' | 'descartar' | 'salvar';

@Component({
  selector: 'app-produtos-detalhe',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, BtnIconeComponent, ListagemPaginadaComponent,
    SelectBuscaComponent, OverlayProgressoComponent, ModalComponent
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

  // ---- Preço (listas) ----
  listasPreco = signal<ListaPreco[]>([]);
  carregandoListas = signal(false);
  modalListaAberto = signal(false);
  listaEditandoId: number | null = null;
  formLista: { codigo: string; nome: string; tipo: string; modoCalculo: 'percentual_venda' | 'percentual_custo'; percentual: number; ativo: boolean } = {
    codigo: '', nome: '', tipo: 'empresa', modoCalculo: 'percentual_venda', percentual: 0, ativo: true
  };
  salvandoLista = signal(false);

  // ---- Web / enriquecimento ----
  enriquecimento = signal<ProdutoEnriquecimento | null>(null);
  carregandoEnriquecimento = signal(false);
  salvandoEnriquecimento = signal(false);
  reenriquecendo = signal(false);
  tagTexto = '';
  sinonimosTexto = '';
  publicoFaixaTexto = '';
  publicoGeneroTexto = '';

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
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.idProduto = Number(this.route.snapshot.paramMap.get('id'));
    const abaQuery = this.route.snapshot.queryParamMap.get('aba') as Aba | null;
    if (abaQuery) this.abaAtiva.set(abaQuery);
    this.carregar();
  }

  abrirSubProduto(id: number) {
    this.router.navigate(['/produtos', id]);
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
        if (this.abaAtiva() === 'web' && !this.enriquecimento()) this.carregarEnriquecimento();

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
  }

  trocarAba(aba: Aba) {
    this.abaAtiva.set(aba);
    if (aba === 'preco' && this.listasPreco().length === 0) this.carregarListasPreco();
    if (aba === 'web' && !this.enriquecimento()) this.carregarEnriquecimento();
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
    this.router.navigate(['/produtos']);
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
    if (okDados && okEnriquecimento) {
      this.sujo.set(false);
      this.modoEdicao.set(false);
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

  salvarDadosErp() {
    this.salvarDadosErpAsync().then(ok => {
      if (ok) { this.toast.sucesso('Quantidade por caixa salva.'); this.recarregarSilencioso(); }
    });
  }

  // ---- Aba Web — Imagens ----

  imagemNoSlot(slot: number): ProdutoImagem | null {
    return this.produto()?.imagens?.[slot] ?? null;
  }

  slotBloqueado(slot: number): boolean {
    const total = this.produto()?.imagens.length ?? 0;
    return slot > total;
  }

  slotAceitaDrop(slot: number): boolean {
    const total = this.produto()?.imagens.length ?? 0;
    return slot <= total;
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

    const totalAtual = this.produto()?.imagens.length ?? 0;
    const vagas = this.maximoImagens - totalAtual;
    const aEnviar = imagens.slice(0, vagas);
    if (imagens.length > aEnviar.length) {
      this.toast.erro(`${imagens.length - aEnviar.length} imagem(ns) não coube(ram) — máximo de ${this.maximoImagens} por produto.`);
    }
    if (aEnviar.length === 0) return;

    this.enviandoImagem.set(true);
    this.imagensConcluidas.set(0);
    this.imagensTotal.set(aEnviar.length);
    this.enviarSequencial(aEnviar, totalAtual + 1, 0);
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
        this.carregandoEnriquecimento.set(false);
      },
      error: err => {
        this.carregandoEnriquecimento.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar os dados de SEO/enriquecimento.');
      }
    });
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
        seoKeywords: e.seoKeywords ?? null,
        seoLinkVideo: e.seoLinkVideo ?? null,
        googleProductCategory: e.googleProductCategory ?? null,
        googleProductType: e.googleProductType ?? null,
        googleBrand: e.googleBrand ?? null,
        googleGtin: e.googleGtin ?? null,
        condicao: e.condicao ?? null,
        disponivelMerchant: e.disponivelMerchant ?? null,
        tag: this.listaTexto(this.tagTexto),
        sinonimos: this.listaTexto(this.sinonimosTexto),
        descricaoEnriquecida: e.descricaoEnriquecida ?? null,
        descricaoLonga: e.descricaoLonga ?? null,
        descricaoUso: e.descricaoUso ?? null,
        publicoFaixa: this.listaTexto(this.publicoFaixaTexto),
        publicoGenero: this.listaTexto(this.publicoGeneroTexto),
        faixaEtaria: e.faixaEtaria ?? null,
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

  salvarEnriquecimento() {
    this.salvarEnriquecimentoAsync().then(ok => {
      if (ok) { this.toast.sucesso('Dados de SEO/enriquecimento salvos.'); this.sujo.set(false); this.carregarEnriquecimento(); }
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
      },
      error: err => {
        this.reenriquecendo.set(false);
        this.toast.erroServidor(err, 'Não foi possível reenriquecer agora — tente novamente em instantes.');
      }
    });
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

  abrirNovaLista() {
    this.listaEditandoId = null;
    this.formLista = { codigo: '', nome: '', tipo: 'empresa', modoCalculo: 'percentual_venda', percentual: 0, ativo: true };
    this.modalListaAberto.set(true);
  }

  abrirEditarLista(lista: ListaPreco) {
    this.listaEditandoId = lista.id;
    this.formLista = {
      codigo: lista.codigo, nome: lista.nome, tipo: lista.tipo,
      modoCalculo: lista.modoCalculo === 'fixo' ? 'percentual_venda' : lista.modoCalculo,
      percentual: lista.percentual ?? 0, ativo: lista.ativo
    };
    this.modalListaAberto.set(true);
  }

  fecharModalLista() {
    this.modalListaAberto.set(false);
  }

  salvarLista() {
    if (!this.formLista.nome.trim()) { this.toast.erro('Informe o nome da lista.'); return; }

    this.salvandoLista.set(true);

    if (this.listaEditandoId) {
      const req: AtualizarListaPrecoRequisicao = {
        nome: this.formLista.nome, tipo: this.formLista.tipo,
        modoCalculo: this.formLista.modoCalculo, percentual: this.formLista.percentual, ativo: this.formLista.ativo
      };
      this.produtosService.atualizarListaPreco(this.listaEditandoId, req).subscribe({
        next: () => { this.salvandoLista.set(false); this.toast.sucesso('Lista atualizada.'); this.modalListaAberto.set(false); this.carregarListasPreco(); this.recarregarSilencioso(); },
        error: err => { this.salvandoLista.set(false); this.toast.erroServidor(err, 'Não foi possível atualizar a lista.'); }
      });
    } else {
      if (!this.formLista.codigo.trim()) { this.toast.erro('Informe o código da lista.'); this.salvandoLista.set(false); return; }
      const req: CriarListaPrecoRequisicao = {
        codigo: this.formLista.codigo, nome: this.formLista.nome, tipo: this.formLista.tipo,
        modoCalculo: this.formLista.modoCalculo, percentual: this.formLista.percentual
      };
      this.produtosService.criarListaPreco(req).subscribe({
        next: () => { this.salvandoLista.set(false); this.toast.sucesso('Lista criada.'); this.modalListaAberto.set(false); this.carregarListasPreco(); this.recarregarSilencioso(); },
        error: err => { this.salvandoLista.set(false); this.toast.erroServidor(err, 'Não foi possível criar a lista.'); }
      });
    }
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

  salvarCodigoFornecedor(fornecedor: ProdutoFornecedor) {
    this.salvandoFornecedorCodigo.set(fornecedor.id);
    const valor = (this.codigoPorFornecedor[fornecedor.id] ?? '').trim();
    this.produtosService.atualizarFornecedor(this.idProduto, fornecedor.id, { codigoNoFornecedor: valor || null }).subscribe({
      next: () => { this.salvandoFornecedorCodigo.set(null); this.toast.sucesso('Código do fornecedor atualizado.'); this.recarregarSilencioso(); },
      error: err => { this.salvandoFornecedorCodigo.set(null); this.toast.erroServidor(err, 'Não foi possível salvar o código.'); }
    });
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
