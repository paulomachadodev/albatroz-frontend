import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { VendasService } from '../../services/vendas.service';
import { VendaPagamento } from '../../models/venda-pagamento.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';

@Component({
  selector: 'app-vendas-por-forma-pagamento',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent],
  templateUrl: './vendas-por-forma-pagamento.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class VendasPorFormaPagamentoComponent implements OnInit {
  forma: string | null = null;

  carregando = signal(true);
  itens = signal<VendaPagamento[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);

  constructor(
    private vendasService: VendasService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.forma = this.route.snapshot.queryParamMap.get('forma');
    this.carregar(1);
  }

  get titulo(): string {
    return this.forma ? `Vendas — ${this.forma}` : 'Vendas por forma de pagamento';
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    this.vendasService.listarPorFormaPagamento(this.forma, { pagina, tamanho: this.tamanhoPagina() }).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as vendas.');
        this.carregando.set(false);
      }
    });
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarData(valor: string): string {
    try {
      return formatDate(valor, 'dd/MM/yyyy', 'pt-BR', 'America/Sao_Paulo');
    } catch {
      return '-';
    }
  }
}
