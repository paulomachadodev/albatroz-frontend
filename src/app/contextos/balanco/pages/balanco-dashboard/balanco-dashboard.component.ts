import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardService, ContagemEstoqueResumo } from '../../../dashboard/dashboard.service';
import { ContagemEstoqueService } from '../../services/contagem-estoque.service';
import { FocoParadosStatus } from '../../models/contagem-estoque.model';
import { AuthService } from '../../../../core/auth/auth.service';
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
  focoParados = signal<FocoParadosStatus | null>(null);
  processandoFoco = signal(false);

  private auth = inject(AuthService);

  podeGerenciarFoco(): boolean {
    return this.auth.temPermissao('estoque:aprovar');
  }

  constructor(
    private dashboardService: DashboardService,
    private contagemEstoqueService: ContagemEstoqueService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregando.set(true);
    forkJoin({
      meta: this.dashboardService.obter('mes').pipe(catchError(() => of(null))),
      foco: this.contagemEstoqueService.obterFocoParadosStatus().pipe(catchError(() => of(null)))
    }).subscribe(({ meta, foco }) => {
      this.meta.set(meta?.dados?.contagemEstoque ?? null);
      this.focoParados.set(foco?.dados ?? null);
      this.carregando.set(false);
    });
  }

  private carregarFocoParados() {
    this.contagemEstoqueService.obterFocoParadosStatus().subscribe({
      next: res => this.focoParados.set(res.dados ?? null),
      error: () => this.focoParados.set(null)
    });
  }

  ativarFocoParados() {
    this.processandoFoco.set(true);
    this.contagemEstoqueService.ativarFocoParados().subscribe({
      next: () => {
        this.processandoFoco.set(false);
        this.toast.sucesso('Foco em parados ativado.', 'A prioridade de contagem agora aponta pra produtos com estoque positivo sem giro.');
        this.carregarFocoParados();
      },
      error: err => {
        this.processandoFoco.set(false);
        this.toast.erroServidor(err, 'Não foi possível ativar o foco.');
      }
    });
  }

  desativarFocoParados() {
    this.processandoFoco.set(true);
    this.contagemEstoqueService.desativarFocoParados().subscribe({
      next: () => {
        this.processandoFoco.set(false);
        this.toast.sucesso('Foco em parados desativado.', 'Prioridade volta ao padrão.');
        this.carregarFocoParados();
      },
      error: err => {
        this.processandoFoco.set(false);
        this.toast.erroServidor(err, 'Não foi possível desativar o foco.');
      }
    });
  }

  percentualBarra(atual: number, meta: number): number {
    if (meta <= 0) return 0;
    return Math.min(100, Math.round((atual / meta) * 100));
  }
}
