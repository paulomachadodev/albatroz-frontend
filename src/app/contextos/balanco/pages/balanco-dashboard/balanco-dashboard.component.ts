import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService, ContagemEstoqueResumo } from '../../../dashboard/dashboard.service';
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
  meta = signal<ContagemEstoqueResumo | null>(null);

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.obter('mes').subscribe({
      next: res => this.meta.set(res.dados?.contagemEstoque ?? null),
      error: () => this.meta.set(null)
    });
  }

  percentualBarra(atual: number, meta: number): number {
    if (meta <= 0) return 0;
    return Math.min(100, Math.round((atual / meta) * 100));
  }
}
