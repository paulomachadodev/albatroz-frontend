import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProdutosService } from '../../services/produtos.service';
import { MarcasService } from '../../services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';
import { ProdutoDetalhe, ProdutoFornecedor, ProdutoImagem } from '../../models/produto.model';
import { ProdutoEstoqueResposta } from '../../dtos/produto-resposta.dto';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { BtnIconeComponent } from '../../../../shared/components/btn-icone/btn-icone.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { OverlayProgressoComponent } from '../../../../shared/components/overlay-progresso/overlay-progresso.component';

type Aba = 'geral' | 'imagens' | 'fornecedores' | 'variacoes' | 'estoque';

@Component({
  selector: 'app-produtos-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BtnIconeComponent, ListagemPaginadaComponent, SelectBuscaComponent, OverlayProgressoComponent],
  templateUrl: './produtos-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosDetalheComponent implements OnInit {
  idProduto!: number;
  carregando = signal(true);
  produto = signal<ProdutoDetalhe | null>(null);
  abaAtiva = signal<Aba>('geral');

  quantidadePorCaixa: number | null = null;
  marcaSelecionada = signal<OpcaoSelectBusca | null>(null);
  fornecedorSelecionado = signal<OpcaoSelectBusca | null>(null);
  salvandoDadosErp = signal(false);
  buscarMarcas = (termo: string) => this.marcasService.buscar(termo);
  buscarFornecedores = (termo: string) => this.contatosService.buscar(termo, 'Fornecedor');

  readonly maximoImagens = 8;
  readonly slotsImagens = [0, 1, 2, 3, 4, 5, 6, 7];

  enviandoImagem = signal(false);
  imagensConcluidas = signal(0);
  imagensTotal = signal(0);
  excluindoImagemId = signal<number | null>(null);
  imagemArrastadaId = signal<number | null>(null);
  salvandoOrdem = signal(false);
  slotArrastadoSobre = signal<number | null>(null);

  correcoesFornecedor: Record<number, string> = {};
  salvandoFornecedor = signal<number | null>(null);

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
        this.marcaSelecionada.set(dados?.idMarca ? { id: dados.idMarca, nome: dados.marca ?? '' } : null);
        this.fornecedorSelecionado.set(dados?.idFornecedorContato
          ? { id: dados.idFornecedorContato, nome: dados.nomeFornecedorContato ?? '' } : null);
        this.correcoesFornecedor = {};
        (dados?.fornecedores ?? []).forEach(f => {
          this.correcoesFornecedor[f.tinyIdFornecedor] = f.codigoProdutoFornecedorCorrigido ?? '';
        });

        if (dados?.tipo === 'simples' && this.abaAtiva() === 'variacoes') {
          this.abaAtiva.set('geral');
        }
        if (this.abaAtiva() === 'estoque' && !this.estoque()) {
          this.carregarEstoque();
        }

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
      next: res => this.produto.set(res.dados ?? null),
      error: err => this.toast.erroServidor(err, 'Não foi possível atualizar o produto.')
    });
  }

  voltar() {
    this.router.navigate(['/produtos']);
  }

  rotuloTipo(tipo: string): string {
    const mapa: Record<string, string> = { simples: 'Simples', kit: 'Kit', variacao: 'Variação' };
    return mapa[tipo] ?? tipo;
  }

  rotuloSituacao(situacao: string): string {
    const mapa: Record<string, string> = { A: 'Ativo', I: 'Inativo', E: 'Excluído' };
    return mapa[situacao] ?? situacao;
  }

  // ---- Aba Geral ----

  aoSelecionarMarca(opcao: OpcaoSelectBusca | null) {
    this.marcaSelecionada.set(opcao);
  }

  aoSelecionarFornecedor(opcao: OpcaoSelectBusca | null) {
    this.fornecedorSelecionado.set(opcao);
  }

  salvarDadosErp() {
    this.salvandoDadosErp.set(true);
    const payload = {
      quantidadePorCaixa: this.quantidadePorCaixa,
      idMarca: this.marcaSelecionada()?.id ?? null,
      idFornecedorContato: this.fornecedorSelecionado()?.id ?? null
    };
    this.produtosService.atualizarDadosErp(this.idProduto, payload).subscribe({
      next: () => {
        this.salvandoDadosErp.set(false);
        this.toast.sucesso('Quantidade por caixa salva.');
        this.recarregarSilencioso();
      },
      error: err => {
        this.salvandoDadosErp.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar.');
      }
    });
  }

  // ---- Aba Imagens ----
  // Grid fixo de 8 slots (posição visual = ordem que o backend já devolve, erp antes de tiny —
  // ver ObterProdutoDetalheConsulta). Só o primeiro slot vazio aceita novo arquivo (regra:
  // não dá pra pular índice); slot ocupado só aceita drop de arquivo pra substituir a imagem.

  imagemNoSlot(slot: number): ProdutoImagem | null {
    return this.produto()?.imagens?.[slot] ?? null;
  }

  slotBloqueado(slot: number): boolean {
    const total = this.produto()?.imagens.length ?? 0;
    return slot > total; // só o primeiro vazio (slot === total) é liberado
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

    // Sem arquivo externo — é drag interno de reordenar entre quadrados já ocupados.
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

  // ---- Aba Estoque ----

  abrirAbaEstoque() {
    this.abaAtiva.set('estoque');
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

  // ---- Aba Fornecedores ----

  salvarFornecedor(fornecedor: ProdutoFornecedor) {
    this.salvandoFornecedor.set(fornecedor.tinyIdFornecedor);
    const valor = (this.correcoesFornecedor[fornecedor.tinyIdFornecedor] ?? '').trim();

    this.produtosService.corrigirFornecedor(this.idProduto, fornecedor.tinyIdFornecedor, {
      codigoProdutoFornecedorCorrigido: valor || null
    }).subscribe({
      next: () => {
        this.salvandoFornecedor.set(null);
        this.toast.sucesso('Código do fornecedor atualizado.');
        this.recarregarSilencioso();
      },
      error: err => {
        this.salvandoFornecedor.set(null);
        this.toast.erroServidor(err, 'Não foi possível salvar a correção.');
      }
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
