import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContagemSessaoService } from '../../services/contagem-sessao.service';
import { ContagemSessaoResumo } from '../../models/contagem-estoque.model';
import { DashboardService, ContagemEstoqueResumo } from '../../../dashboard/dashboard.service';
import { formatarDataHora } from '../../../../shared/utils/formatar-data-hora.util';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-balanco-dashboard',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './balanco-dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class BalancoDashboardComponent implements OnInit {
  carregando = signal(true);
  meta = signal<ContagemEstoqueResumo | null>(null);
  sessoesAbertas = signal<ContagemSessaoResumo[]>([]);

  constructor(
    private contagemSessaoService: ContagemSessaoService,
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregando.set(true);
    this.contagemSessaoService.listar(undefined, true).subscribe({
      next: res => {
        this.sessoesAbertas.set(res.dados ?? []);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as contagens em aberto.');
        this.carregando.set(false);
      }
    });

    this.dashboardService.obter('mes').subscribe({
      next: res => this.meta.set(res.dados?.contagemEstoque ?? null),
      error: () => this.meta.set(null)
    });
  }

  formatarDataHora = formatarDataHora;

  rotuloModo(sessao: ContagemSessaoResumo): string {
    const base = sessao.modo === 'prioridade' ? 'Prioridade'
      : sessao.modo === 'categoria' ? 'Categoria'
      : sessao.modo === 'marca' ? 'Marca'
      : 'Filtrada';
    return sessao.categoriaRaiz ? `${base} — ${sessao.categoriaRaiz}` : sessao.marcaNome ? `${base} — ${sessao.marcaNome}` : base;
  }

  percentualBarra(atual: number, meta: number): number {
    if (meta <= 0) return 0;
    return Math.min(100, Math.round((atual / meta) * 100));
  }
}
