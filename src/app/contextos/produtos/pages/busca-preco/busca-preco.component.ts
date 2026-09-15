import { Component, signal } from '@angular/core';
import { ProdutosService } from '../../services/produtos.service';
import { ProdutoResumo } from '../../models/produto.model';
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
export class BuscaPrecoComponent {
  leitorAberto = signal(false);
  buscando = signal(false);
  ultimoProduto = signal<ProdutoResumo | null>(null);
  ultimoCodigoNaoEncontrado = signal<string | null>(null);

  constructor(private produtosService: ProdutosService, private toast: ToastService) {}

  abrirLeitor() {
    this.ultimoCodigoNaoEncontrado.set(null);
    this.leitorAberto.set(true);
  }

  fecharLeitor() {
    this.leitorAberto.set(false);
  }

  aoLerCodigo(codigo: string) {
    if (this.buscando()) return;
    this.buscando.set(true);
    this.ultimoCodigoNaoEncontrado.set(null);

    this.produtosService.listar({ pagina: 1, tamanho: 1 }, { texto: codigo, situacao: 'A' }).subscribe({
      next: res => {
        this.buscando.set(false);
        const produto = (res.dados?.dados ?? [])[0] ?? null;
        if (produto && produto.tipo === 'simples') {
          this.ultimoProduto.set(produto);
          this.fecharLeitor();
        } else {
          this.ultimoProduto.set(null);
          this.ultimoCodigoNaoEncontrado.set(codigo);
        }
      },
      error: err => {
        this.buscando.set(false);
        this.toast.erroServidor(err, 'Não foi possível buscar o produto.');
      }
    });
  }

  formatarReais(valor: number | null | undefined): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
