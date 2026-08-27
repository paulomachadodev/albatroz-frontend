import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComprasService, PainelFornecedorFiltro } from '../../services/compras.service';
import { PainelFornecedor } from '../../models/painel-fornecedor.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';

@Component({
  selector: 'app-fornecedores-painel',
  standalone: true,
  imports: [RouterLink, FormsModule, ListagemPaginadaComponent, PageHeaderComponent, ThOrdenavelComponent],
  templateUrl: './fornecedores-painel.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class FornecedoresPainelComponent implements OnInit {
  carregando = signal(true);
  itens = signal<PainelFornecedor[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(20);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtro: PainelFornecedorFiltro = {};

  constructor(
    private comprasService: ComprasService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.comprasService.listarPainelFornecedores({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o painel de fornecedores.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() { this.carregar(1); }
  limparFiltros() { this.filtro = {}; this.carregar(1); }
  aoMudarPagina(pagina: number) { this.carregar(pagina); }
  aoMudarTamanhoPagina(tamanho: number) { this.tamanhoPagina.set(tamanho); this.carregar(1); }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.filtro.ordenarPor = ordenacao.campo;
    this.filtro.direcao = ordenacao.direcao;
    this.carregar(1);
  }

  fecharPedido(item: PainelFornecedor) {
    this.router.navigate(['/compras'], {
      queryParams: { idFornecedor: item.idFornecedor, fornecedorNome: item.fornecedor }
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
