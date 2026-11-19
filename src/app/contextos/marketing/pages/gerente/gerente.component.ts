import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { DIAS_SEMANA } from '../../models/insights.model';
import { PlanoSemanal, PostagemSugerida } from '../../models/gerente.model';
import { GerenteService } from '../../services/gerente.service';

@Component({
  selector: 'app-gerente-marketing', standalone: true,
  imports: [DatePipe, RouterLink, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './gerente.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class GerenteMarketingComponent {
  private readonly service = inject(GerenteService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly diasSemana = DIAS_SEMANA;
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly plano = signal<PlanoSemanal | null>(null);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.service.planoSemanal().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.carregando.set(false);
        if (res.sucesso && res.dados) this.plano.set(res.dados);
        else this.erro.set('Não foi possível montar o plano.');
      },
      error: erro => {
        this.carregando.set(false);
        const mensagem = erro?.error?.erro?.mensagem;
        if (typeof mensagem === 'string' && mensagem) this.erro.set(mensagem);
        else { this.erro.set('Não foi possível montar o plano.'); this.toast.erroServidor(erro, 'Não foi possível montar o plano.'); }
      }
    });
  }

  parametros(p: PostagemSugerida): Record<string, string> {
    return { linha: p.linha, ...(p.manchete ? { assunto: p.manchete } : {}) };
  }
}
