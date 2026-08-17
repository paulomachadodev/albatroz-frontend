import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProdutosService } from '../../services/produtos.service';
import { ProdutoDetalhe, ProdutoFornecedor, ProdutoImagem } from '../../models/produto.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';

type Aba = 'geral' | 'imagens' | 'fornecedores' | 'variacoes';

@Component({
  selector: 'app-produtos-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './produtos-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosDetalheComponent implements OnInit {
  idProduto!: number;
  carregando = signal(true);
  produto = signal<ProdutoDetalhe | null>(null);
  abaAtiva = signal<Aba>('geral');

  quantidadePorCaixa: number | null = null;
  salvandoDadosErp = signal(false);

  enviandoImagem = signal(false);
  excluindoImagemId = signal<number | null>(null);
  imagemArrastadaId = signal<number | null>(null);
  salvandoOrdem = signal(false);
  arrastandoArquivoSobreZona = signal(false);

  correcoesFornecedor: Record<number, string> = {};
  salvandoFornecedor = signal<number | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produtosService: ProdutosService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.idProduto = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.produtosService.obter(this.idProduto).subscribe({
      next: res => {
        const dados = res.dados ?? null;
        this.produto.set(dados);
        this.quantidadePorCaixa = dados?.quantidadePorCaixa ?? null;
        this.correcoesFornecedor = {};
        (dados?.fornecedores ?? []).forEach(f => {
          this.correcoesFornecedor[f.tinyIdFornecedor] = f.codigoProdutoFornecedorCorrigido ?? '';
        });

        if (dados?.tipo === 'simples' && this.abaAtiva() === 'variacoes') {
          this.abaAtiva.set('geral');
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

  salvarDadosErp() {
    this.salvandoDadosErp.set(true);
    this.produtosService.atualizarDadosErp(this.idProduto, { quantidadePorCaixa: this.quantidadePorCaixa }).subscribe({
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

  aoSelecionarArquivosImagem(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivos = input.files;
    if (!arquivos || arquivos.length === 0) return;
    this.enviarArquivos(Array.from(arquivos));
    input.value = '';
  }

  aoSoltarArquivos(event: DragEvent) {
    event.preventDefault();
    this.arrastandoArquivoSobreZona.set(false);
    const arquivos = event.dataTransfer?.files;
    if (!arquivos || arquivos.length === 0) return;
    this.enviarArquivos(Array.from(arquivos));
  }

  aoArrastarArquivoSobre(event: DragEvent) {
    event.preventDefault();
    this.arrastandoArquivoSobreZona.set(true);
  }

  aoSairArquivoDaZona() {
    this.arrastandoArquivoSobreZona.set(false);
  }

  private enviarArquivos(arquivos: File[]) {
    const imagens = arquivos.filter(a => a.type.startsWith('image/'));
    if (imagens.length === 0) {
      this.toast.erro('Selecione apenas arquivos de imagem.');
      return;
    }

    this.enviandoImagem.set(true);
    this.enviarProxima(imagens, 0);
  }

  private enviarProxima(arquivos: File[], indice: number) {
    if (indice >= arquivos.length) {
      this.enviandoImagem.set(false);
      this.toast.sucesso(arquivos.length > 1 ? 'Imagens enviadas.' : 'Imagem enviada.');
      this.recarregarSilencioso();
      return;
    }

    this.produtosService.uploadImagem(this.idProduto, arquivos[indice]).subscribe({
      next: () => this.enviarProxima(arquivos, indice + 1),
      error: err => {
        this.enviandoImagem.set(false);
        this.toast.erroServidor(err, 'Não foi possível enviar a imagem.');
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
