import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  carregando = signal(true);
  meta = signal<ContagemEstoqueResumo | null>(null);

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!window.matchMedia('(max-width: 767px)').matches) {
      this.router.navigate(['/balanco/planilha'], { replaceUrl: true });
      return;
    }

    this.carregando.set(true);
    this.dashboardService.obter('mes').pipe(catchError(() => of(null))).subscribe(meta => {
      this.meta.set(meta?.dados?.contagemEstoque ?? null);
      this.carregando.set(false);
    });
  }

  percentualBarra(atual: number, meta: number): number {
    if (meta <= 0) return 0;
    return Math.min(100, Math.round((atual / meta) * 100));
  }
}
