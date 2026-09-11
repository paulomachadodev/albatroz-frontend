import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ContasPagarService } from '../../services/contas-pagar.service';
import { ContaPagar, FiltroContasPagar } from '../../models/conta-pagar.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';

interface ConfigFiltro {
  titulo: string;
  subtitulo: string;
}

const CONFIGS: Record<FiltroContasPagar, ConfigFiltro> = {
  vencidas: {
    titulo: 'Contas vencidas',
    subtitulo: 'Títulos em aberto com vencimento anterior a hoje.'
  },
  'vence-hoje': {
    titulo: 'Contas que vencem hoje',
    subtitulo: 'Títulos em aberto com vencimento hoje.'
  },
  todas: {
    titulo: 'Contas a pagar em aberto',
    subtitulo: 'Todos os títulos em aberto, ordenados por vencimento.'
  }
};

@Component({
  selector: 'app-contas-pagar-lista',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent],
  templateUrl: './contas-pagar-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContasPagarListaComponent implements OnInit {
  filtro!: FiltroContasPagar;
  config!: ConfigFiltro;

  carregando = signal(true);
  itens = signal<ContaPagar[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);

  constructor(
    private contasPagarService: ContasPagarService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.filtro = (this.route.snapshot.queryParamMap.get('filtro') as FiltroContasPagar) ?? 'todas';
    this.config = CONFIGS[this.filtro] ?? CONFIGS.todas;
    this.carregar(1);
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    this.contasPagarService.listar(this.filtro, { pagina, tamanho: this.tamanhoPagina() }).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as contas a pagar.');
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

  formatarData(valor: string | null): string {
    if (!valor) return '-';
    try {
      return formatDate(valor, 'dd/MM/yyyy', 'pt-BR', 'America/Sao_Paulo');
    } catch {
      return '-';
    }
  }
}
