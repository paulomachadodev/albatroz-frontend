import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProdutosService, ProdutoFiltro } from '../../services/produtos.service';
import { ProdutoResumo } from '../../models/produto.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';

@Component({
  selector: 'app-produtos-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ListagemPaginadaComponent, PageHeaderComponent, ThOrdenavelComponent],
  templateUrl: './produtos-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<ProdutoResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtro: ProdutoFiltro = {};

  constructor(
    private produtosService: ProdutosService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    // Restaura filtro/página/ordenação da última visita à lista (ex.: usuário voltou da
    // tela de detalhe) em vez de resetar a busca do zero.
    const estado = this.produtosService.estadoLista;
    if (estado) {
      this.filtro = { ...estado.filtro };
      this.tamanhoPagina.set(estado.tamanhoPagina);
      if (this.filtro.ordenarPor && this.filtro.direcao) {
        this.ordenacaoAtual.set({ campo: this.filtro.ordenarPor, direcao: this.filtro.direcao });
      }
      this.carregar(estado.pagina);
    } else {
      this.carregar();
    }
  }

  private salvarEstado(pagina: number) {
    this.produtosService.estadoLista = {
      filtro: { ...this.filtro },
      pagina,
      tamanhoPagina: this.tamanhoPagina()
    };
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.salvarEstado(pagina);
    this.produtosService.listar({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os produtos.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = {};
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

  abrirDetalhe(item: ProdutoResumo) {
    this.router.navigate(['/produtos', item.id]);
  }

  irParaImportar() {
    this.router.navigate(['/produtos/importar-imagens']);
  }

  rotuloTipo(tipo: string): string {
    const mapa: Record<string, string> = { simples: 'Simples', kit: 'Kit', variacao: 'Variação' };
    return mapa[tipo] ?? tipo;
  }

  classeTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      simples: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      kit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      variacao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    };
    return mapa[tipo] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  }

  rotuloSituacao(situacao: string): string {
    const mapa: Record<string, string> = { A: 'Ativo', I: 'Inativo', E: 'Excluído' };
    return mapa[situacao] ?? situacao;
  }

  classeSituacao(situacao: string): string {
    const mapa: Record<string, string> = {
      A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      I: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      E: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
    };
    return mapa[situacao] ?? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
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
