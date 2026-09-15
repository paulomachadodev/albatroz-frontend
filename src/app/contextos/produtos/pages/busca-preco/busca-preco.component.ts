import { Component, OnInit, signal } from '@angular/core';
import { ProdutosService } from '../../services/produtos.service';
import { ProdutoResumo, ProdutoImagem } from '../../models/produto.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { LeitorCodigoBarrasComponent } from '../../../../shared/components/leitor-codigo-barras/leitor-codigo-barras.component';

@Component({
  selector: 'app-busca-preco',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, LeitorCodigoBarrasComponent],
  templateUrl: './busca-preco.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class BuscaPrecoComponent implements OnInit {
  leitorAberto = signal(false);
  buscando = signal(false);
  ultimoProduto = signal<ProdutoResumo | null>(null);
  ultimoCodigoNaoEncontrado = signal<string | null>(null);
  imagensProduto = signal<ProdutoImagem[]>([]);
  indiceImagemAtual = signal(0);

  private timeoutNaoEncontrado?: ReturnType<typeof setTimeout>;

  constructor(private produtosService: ProdutosService, private toast: ToastService) {}

  ngOnInit() {
    if (window.matchMedia('(max-width: 767px)').matches) {
      this.abrirLeitor();
    }
  }

  abrirLeitor() {
    clearTimeout(this.timeoutNaoEncontrado);
    this.ultimoCodigoNaoEncontrado.set(null);
    this.leitorAberto.set(true);
  }

  fecharLeitor() {
    this.leitorAberto.set(false);
  }

  aoLerCodigo(codigo: string) {
    if (this.buscando()) return;
    this.buscando.set(true);
    clearTimeout(this.timeoutNaoEncontrado);
    this.ultimoCodigoNaoEncontrado.set(null);

    this.produtosService.listar({ pagina: 1, tamanho: 1 }, { texto: codigo, situacao: 'A' }).subscribe({
      next: res => {
        this.buscando.set(false);
        const produto = (res.dados?.dados ?? [])[0] ?? null;
        if (produto && produto.tipo === 'simples') {
          this.ultimoProduto.set(produto);
          this.imagensProduto.set([]);
          this.indiceImagemAtual.set(0);
          this.fecharLeitor();
          this.carregarImagens(produto.id);
        } else {
          this.ultimoProduto.set(null);
          this.imagensProduto.set([]);
          this.ultimoCodigoNaoEncontrado.set(codigo);
          clearTimeout(this.timeoutNaoEncontrado);
          this.timeoutNaoEncontrado = setTimeout(() => this.ultimoCodigoNaoEncontrado.set(null), 5000);
        }
      },
      error: err => {
        this.buscando.set(false);
        this.toast.erroServidor(err, 'Não foi possível buscar o produto.');
      }
    });
  }

  aoRolarCarrossel(elemento: HTMLDivElement) {
    const largura = elemento.clientWidth;
    if (!largura) return;
    this.indiceImagemAtual.set(Math.round(elemento.scrollLeft / largura));
  }

  private carregarImagens(idProduto: number) {
    this.produtosService.obter(idProduto).subscribe({
      next: res => {
        const imagens = (res.dados?.imagens ?? []).slice().sort((a, b) => a.indice - b.indice);
        this.imagensProduto.set(imagens);
      },
      error: () => this.imagensProduto.set([])
    });
  }

  formatarReais(valor: number | null | undefined): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
