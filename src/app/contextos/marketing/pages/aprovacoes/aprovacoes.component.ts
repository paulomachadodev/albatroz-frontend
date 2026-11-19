import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Aprovacao, STATUS_APROVACAO } from '../../models/rotina.model';
import { RotinasService } from '../../services/rotinas.service';

@Component({
  selector: 'app-aprovacoes-marketing', standalone: true,
  imports: [DatePipe, RouterLink, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './aprovacoes.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class AprovacoesMarketingComponent {
  private readonly service = inject(RotinasService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly habilitado = signal(true);
  readonly emPreparo = signal(0);
  readonly itens = signal<Aprovacao[]>([]);
  readonly processando = signal<number | null>(null);
  readonly aguardando = computed(() => this.itens().filter(i => i.status === STATUS_APROVACAO.aguardando));
  readonly falhas = computed(() => this.itens().filter(i => i.status === STATUS_APROVACAO.falhou));
  readonly podeAprovar = computed(() => this.auth.temPermissao('marketing:aprovar'));

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.service.aprovacoes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.carregando.set(false);
        if (!res.sucesso || !res.dados) { this.erro.set('Não foi possível carregar as aprovações.'); return; }
        this.habilitado.set(res.dados.habilitado);
        this.emPreparo.set(res.dados.emPreparo);
        this.itens.set(res.dados.itens);
      },
      error: erro => { this.carregando.set(false); this.erro.set('Não foi possível carregar as aprovações.'); this.toast.erroServidor(erro, 'Não foi possível carregar as aprovações.'); }
    });
  }

  async aprovar(item: Aprovacao): Promise<void> {
    if (!this.podeAprovar() || this.processando() !== null) return;
    const confirmado = await this.confirm.confirmar('Aprovar e agendar?', `O texto e as artes serão aprovados e a postagem agendada para ${new Date(item.previstoPara).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`, { textoConfirmar: 'Aprovar e agendar', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    this.processando.set(item.execucaoId);
    try {
      const res = await firstValueFrom(this.service.aprovar(item.execucaoId, item.versao));
      if (res.sucesso) this.toast.sucesso('Postagem aprovada e agendada.'); else this.toast.erro('Não foi possível aprovar e agendar.');
    } catch (erro) {
      this.toast.erroServidor(erro, 'Não foi possível aprovar e agendar.');
    } finally {
      this.processando.set(null);
      this.carregar();
    }
  }

  async descartar(item: Aprovacao): Promise<void> {
    if (!this.podeAprovar() || this.processando() !== null) return;
    const confirmado = await this.confirm.confirmar('Descartar esta postagem?', 'Nada será publicado. A rotina prepara a próxima no horário seguinte.', { textoConfirmar: 'Descartar', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    this.processando.set(item.execucaoId);
    try {
      const res = await firstValueFrom(this.service.descartar(item.execucaoId, item.versao));
      if (res.sucesso) this.toast.sucesso('Postagem descartada.'); else this.toast.erro('Não foi possível descartar.');
    } catch (erro) {
      this.toast.erroServidor(erro, 'Não foi possível descartar.');
    } finally {
      this.processando.set(null);
      this.carregar();
    }
  }
}
