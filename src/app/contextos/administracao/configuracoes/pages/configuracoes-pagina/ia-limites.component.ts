import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize, takeUntil } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { IaLimites, IaLimiteReserva } from '../../models/ia-limites.model';
import { IaLimitesService } from '../../services/ia-limites.service';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';

function fusoValido(controle: AbstractControl): { fuso: true } | null {
  try { new Intl.DateTimeFormat('pt-BR', { timeZone: String(controle.value).trim() }); return null; } catch { return { fuso: true }; }
}

function inteiroOpcional(controle: AbstractControl): { inteiro: true } | null {
  return controle.value == null || Number.isInteger(controle.value) ? null : { inteiro: true };
}

@Component({
  selector: 'app-ia-limites', standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, InputTextModule, SelectModule, BreadcrumbComponent, PageHeaderComponent, ListagemPaginadaComponent, ModalComponent],
  templateUrl: './ia-limites.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class IaLimitesComponent extends ConfiguracaoFormularioBase {
  private readonly service = inject(IaLimitesService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly navegacao = inject(Router);
  private readonly fb = inject(FormBuilder);
  private consulta?: Subscription;
  private acao?: Subscription;
  private acaoId = 0;
  protected override permissaoEdicao = 'ia_configuracoes:editar';
  readonly acessoValido = computed(() => this.contextoValido() && this.auth.temPermissao('ia_configuracoes:ler'));
  readonly dados = signal<IaLimites | null>(null);
  readonly carregando = signal(true);
  readonly processando = signal(false);
  readonly disponivel = computed(() => this.acessoValido() && this.dados()?.habilitado === true);
  readonly temValorDesconhecido = computed(() => this.dados()?.reservas.some(reserva => reserva.semReserva === true) ?? false);
  readonly reservaSelecionada = signal<IaLimiteReserva | null>(null);
  readonly estadosPolitica = [{ rotulo: 'Desligada', valor: false }, { rotulo: 'Ativa', valor: true }];
  readonly selectPt = { root: 'relative block w-full', label: 'block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm', dropdown: 'absolute right-3 top-1/2 -translate-y-1/2', overlay: 'bg-white dark:bg-slate-800 border border-slate-200 rounded-lg shadow-lg z-50', list: 'py-1', option: 'px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' };
  readonly form = this.fb.group({
    ativo: this.fb.nonNullable.control(false),
    orcamentoMensalUsd: this.fb.control<number | null>(null, Validators.min(0)),
    limiteExecucaoUsd: this.fb.control<number | null>(null, Validators.min(0)),
    reservaTentativaUsd: this.fb.nonNullable.control(0.01, [Validators.required, Validators.min(0.000000000001)]),
    concorrenciaMaxima: this.fb.control<number | null>(null, [Validators.min(1), inteiroOpcional]),
    alertaPercentual: this.fb.nonNullable.control(80, [Validators.required, Validators.min(1), Validators.max(100), inteiroOpcional]),
    fusoHorario: this.fb.nonNullable.control(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', [Validators.required, fusoValido]),
    destinatarios: this.fb.nonNullable.control('', Validators.maxLength(4000))
  });
  readonly conciliacao = this.fb.group({ valorApuradoUsd: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]), justificativa: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]) });

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.cancelarAcao());
    effect(() => {
      const acesso = this.acessoValido();
      const editar = this.podeEditar();
      const disponivel = this.disponivel();
      untracked(() => {
        if (!acesso) {
          this.consulta?.unsubscribe();
          this.cancelarAcao();
          this.dados.set(null);
          this.form.reset();
          this.alterado.set(false);
          this.carregando.set(false);
          if (this.contextoValido()) queueMicrotask(() => {
            if (!this.destroyRef.destroyed && !this.acessoValido()) void this.navegacao.navigate(['/configuracoes'], { replaceUrl: true });
          });
        }
        if (!editar || !acesso) {
          this.cancelarAcao();
          this.form.disable({ emitEvent: false });
          this.alterado.set(false);
        } else if (disponivel) this.form.enable({ emitEvent: false });
      });
    });
    this.carregar();
  }

  carregar(): void {
    if (!this.acessoValido() || this.processando()) return;
    this.cancelarAcao();
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.consulta = this.service.obter().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: resposta => {
        if (!this.acessoValido()) return;
        if (resposta.sucesso && resposta.dados) this.receber(resposta.dados);
        else this.toast.erro('Não foi possível consultar os limites de IA.');
      },
      error: erro => { if (this.acessoValido()) this.toast.erroServidor(erro, 'Não foi possível consultar os limites de IA.'); }
    });
  }

  async salvar(): Promise<void> {
    this.form.markAllAsTouched();
    if (!this.podeEditar() || !this.disponivel() || this.form.invalid || this.processando()) return;
    const valores = this.form.getRawValue();
    const versao = this.dados()!.configuracao.versao;
    if ([valores.orcamentoMensalUsd, valores.limiteExecucaoUsd, valores.reservaTentativaUsd, valores.concorrenciaMaxima, valores.alertaPercentual].some(valor => valor !== null && !Number.isFinite(valor))) { this.toast.aviso('Informe valores numéricos válidos.'); return; }
    const destinatarios = valores.destinatarios.split(/[;,\n]/).map(email => email.trim()).filter(Boolean);
    if (destinatarios.length > 10 || destinatarios.some(email => email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) { this.toast.aviso('Informe até 10 e-mails válidos, com até 254 caracteres cada.'); return; }
    const id = ++this.acaoId;
    const confirmado = await this.confirm.confirmar('Salvar limites de IA?', 'A política protege validações Google e geração de textos de marketing. Reservas são estimativas e a cobrança externa pode excedê-las.', { textoConfirmar: 'Salvar' });
    if (!confirmado || id !== this.acaoId || this.destroyRef.destroyed || !this.podeEditar() || !this.disponivel()) return;
    this.processando.set(true);
    this.acao = this.service.salvar({ ...valores, versao, fusoHorario: valores.fusoHorario.trim(), destinatarios }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!this.acaoValida(id)) return;
        this.processando.set(false);
        if (resposta.sucesso && resposta.dados) { this.receber(resposta.dados); this.toast.sucesso('Limites de IA salvos.'); }
        else this.toast.erro('Não foi possível salvar. Atualize a consulta antes de repetir.');
      },
      error: erro => { if (this.acaoValida(id)) { this.processando.set(false); this.toast.erroServidor(erro, 'Não foi possível salvar. Atualize a consulta antes de repetir.'); } }
    });
  }

  abrirConciliacao(reserva: IaLimiteReserva): void {
    if (!this.podeEditar() || !this.disponivel() || this.processando() || reserva.status !== 3) return;
    if (this.alterado()) { this.toast.aviso('Salve a política antes de conciliar uma reserva.'); return; }
    this.conciliacao.reset({ valorApuradoUsd: null, justificativa: '' });
    this.reservaSelecionada.set(reserva);
  }

  fecharConciliacao(): void {
    if (!this.processando()) {
      this.reservaSelecionada.set(null);
      this.alterado.set(this.form.dirty);
    }
  }

  async conciliar(): Promise<void> {
    const reserva = this.reservaSelecionada();
    this.conciliacao.markAllAsTouched();
    if (!reserva || reserva.status !== 3 || !this.disponivel() || !this.podeEditar() || this.processando() || this.conciliacao.invalid) return;
    const valores = this.conciliacao.getRawValue();
    if (valores.justificativa.trim().length < 10 || /[\u0000-\u001F\u007F]/.test(valores.justificativa) || valores.valorApuradoUsd === null || !Number.isFinite(valores.valorApuradoUsd)) { this.toast.aviso('Informe um valor válido e justificativa de 10 a 500 caracteres, sem quebras de linha.'); return; }
    const id = ++this.acaoId;
    const confirmado = await this.confirm.confirmar('Confirmar conciliação?', 'Informe o valor comprovado. A conciliação fica registrada para auditoria e não altera o custo público do consumo.', { textoConfirmar: 'Conciliar' });
    if (!confirmado || !this.acaoValida(id)) return;
    this.processando.set(true);
    this.acao = this.service.conciliar(reserva.tentativaId, valores.valorApuradoUsd, valores.justificativa.trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!this.acaoValida(id)) return;
        this.processando.set(false);
        if (resposta.sucesso && resposta.dados) { this.receber(resposta.dados); this.reservaSelecionada.set(null); this.toast.sucesso('Conciliação registrada.'); }
        else this.toast.erro('Não foi possível conciliar. Atualize a consulta antes de repetir.');
      },
      error: erro => { if (this.acaoValida(id)) { this.processando.set(false); this.toast.erroServidor(erro, 'Não foi possível conciliar. Atualize a consulta antes de repetir.'); } }
    });
  }

  moeda(valor: number | null): string {
    return valor === null ? 'Sem limite configurado' : 'USD ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 12 }).format(valor);
  }

  statusReserva(status: number): string {
    return ({ 1: 'Ativa', 2: 'Apurada', 3: 'Incerta', 4: 'Conciliada' } as Record<number, string>)[status] ?? 'Desconhecida';
  }

  tipoAlerta(tipo: number): string {
    return ({ 1: 'Limiar de orçamento', 2: 'Orçamento excedido', 3: 'Custo incerto', 4: 'Reserva excedida' } as Record<number, string>)[tipo] ?? 'Alerta';
  }

  statusAlerta(status: number): string {
    return ({ 1: 'Pendente', 2: 'Em envio', 3: 'Enviado', 4: 'Falha', 5: 'Local (sem e-mail)' } as Record<number, string>)[status] ?? 'Desconhecida';
  }

  private receber(dados: IaLimites): void {
    this.dados.set(dados);
    this.form.reset({ ...dados.configuracao, destinatarios: dados.configuracao.destinatarios.join('; ') });
    if (!dados.habilitado || !this.podeEditar()) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
    this.marcarSalvo();
  }

  private acaoValida(id: number): boolean {
    return id === this.acaoId && !this.destroyRef.destroyed && this.acessoValido() && this.podeEditar() && this.disponivel();
  }

  private cancelarAcao(): void {
    this.acaoId++;
    this.acao?.unsubscribe();
    this.processando.set(false);
    this.reservaSelecionada.set(null);
    this.conciliacao.reset();
  }
}
