import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectModule } from 'primeng/select';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PERFIL_SELECT_PT } from '../../../administracao/configuracoes/models/perfil-social.model';
import { DIAS_SEMANA, InsightsInstagram, PERIODOS_INSIGHTS } from '../../models/insights.model';
import { InsightsService } from '../../services/insights.service';

@Component({
  selector: 'app-insights-marketing', standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, SelectModule, BreadcrumbComponent, PageHeaderComponent, ListagemPaginadaComponent],
  templateUrl: './insights.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class InsightsMarketingComponent {
  private readonly service = inject(InsightsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectPt = PERFIL_SELECT_PT;
  readonly periodos = PERIODOS_INSIGHTS;
  readonly diasSemana = DIAS_SEMANA;
  readonly dias = signal(30);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly dados = signal<InsightsInstagram | null>(null);

  constructor() {
    this.carregar();
  }

  classeConfianca(confianca: string): string {
    return confianca === 'Boa' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : confianca === 'Media' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
  }

  trocarPeriodo(dias: number): void {
    this.dias.set(dias);
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.service.obterInstagram(this.dias()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.carregando.set(false);
        if (res.sucesso && res.dados) this.dados.set(res.dados);
        else this.erro.set('Não foi possível carregar os insights.');
      },
      error: erro => {
        this.carregando.set(false);
        const mensagem = erro?.error?.erro?.mensagem;
        if (typeof mensagem === 'string' && mensagem) this.erro.set(mensagem);
        else { this.erro.set('Não foi possível carregar os insights.'); this.toast.erroServidor(erro, 'Não foi possível carregar os insights.'); }
      }
    });
  }
}
