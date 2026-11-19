import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, exhaustMap, timer } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { DIAS_SEMANA } from '../../models/insights.model';
import { AnaliseGerenteGeracao, PlanoSemanal, PostagemSugerida } from '../../models/gerente.model';
import { GerenteService } from '../../services/gerente.service';

@Component({
  selector: 'app-gerente-marketing', standalone: true,
  imports: [DatePipe, RouterLink, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './gerente.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class GerenteMarketingComponent {
  private readonly service = inject(GerenteService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly diasSemana = DIAS_SEMANA;
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly plano = signal<PlanoSemanal | null>(null);
  readonly analise = signal<AnaliseGerenteGeracao | null>(null);
  readonly analiseDisponivel = signal(false);
  readonly pedindo = signal(false);
  readonly podePedirAnalise = computed(() => this.analiseDisponivel() && this.auth.temPermissao('marketing:criar') && !this.pedindo() && !this.emAndamento());
  readonly emAndamento = computed(() => this.analise()?.status === 1 || this.analise()?.status === 2);
  private polling?: Subscription;

  constructor() {
    this.carregar();
    this.carregarAnalise();
    this.destroyRef.onDestroy(() => this.polling?.unsubscribe());
  }

  carregarAnalise(): void {
    this.service.ultimaAnalise().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.analiseDisponivel.set(!!res.dados?.habilitado);
        this.analise.set(res.dados?.analise ?? null);
        if (this.emAndamento()) this.acompanharAnalise();
      },
      error: () => this.analiseDisponivel.set(false)
    });
  }

  pedirAnalise(): void {
    if (!this.podePedirAnalise()) return;
    this.pedindo.set(true);
    this.service.pedirAnalise(crypto.randomUUID()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.pedindo.set(false);
        if (res.sucesso && res.dados) { this.analise.set(res.dados); this.acompanharAnalise(); }
        else this.toast.erro('Não foi possível pedir a análise.');
      },
      error: erro => { this.pedindo.set(false); this.toast.erroServidor(erro, 'Não foi possível pedir a análise.'); }
    });
  }

  private acompanharAnalise(): void {
    this.polling?.unsubscribe();
    this.polling = timer(3000, 3000).pipe(exhaustMap(() => this.service.ultimaAnalise()), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.analise.set(res.dados?.analise ?? null);
        if (!this.emAndamento()) this.polling?.unsubscribe();
      },
      error: () => this.polling?.unsubscribe()
    });
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
