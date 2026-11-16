import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, takeUntil } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { IaConfiguracao } from '../../models/ia-configuracao.model';
import { IaConfiguracaoService } from '../../services/ia-configuracao.service';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';

@Component({
  selector: 'app-configuracao-ia', standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, InputTextModule, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './ia-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class IaConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
  private readonly service = inject(IaConfiguracaoService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  protected override permissaoEdicao = 'ia_configuracoes:editar';
  readonly carregando = signal(true);
  readonly processando = signal(false);
  readonly configuracao = signal<IaConfiguracao | null>(null);
  readonly disponivel = computed(() => this.contextoValido() && this.configuracao()?.habilitado === true);
  readonly podeRemover = computed(() => this.disponivel() && this.auth.temPermissao('ia_configuracoes:excluir') && this.configuracao()?.configurada === true);
  readonly form = this.fb.nonNullable.group({
    chave: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(200), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    modelo: ['gemini-2.5-flash-lite', [Validators.required, Validators.maxLength(87), Validators.pattern(/^gemini-[a-z0-9.-]{1,80}$/)]]
  });

  constructor() {
    super();
    effect(() => {
      if (!this.contextoValido()) {
        this.form.reset({ chave: '', modelo: 'gemini-2.5-flash-lite' });
        this.configuracao.set(null);
      }
    });
    this.destroyRef.onDestroy(() => this.form.controls.chave.reset(''));
  }

  ngOnInit(): void {
    this.service.obter().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível carregar a configuração de IA.'); return; }
        this.configuracao.set(resposta.dados);
        this.form.controls.modelo.setValue(resposta.dados.modelo ?? 'gemini-2.5-flash-lite');
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar a configuração de IA.')
    });
  }

  async salvar(): Promise<void> {
    this.form.markAllAsTouched();
    if (!this.podeEditar() || !this.disponivel() || this.processando() || this.form.invalid) return;
    const confirmado = await this.confirm.confirmar('Validar e salvar chave Google?', 'A validação realiza uma chamada mínima ao Google, que pode gerar cobrança na sua conta. Uma chave inválida mantém a configuração anterior.', { textoConfirmar: 'Validar e salvar' });
    if (!confirmado || !this.podeEditar() || !this.disponivel() || this.processando() || this.form.invalid) return;
    this.processando.set(true);
    const { chave, modelo } = this.form.getRawValue();
    this.service.salvar(chave.trim(), modelo.trim()).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        this.form.controls.chave.reset('');
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível validar e salvar a chave.'); return; }
        this.configuracao.set(resposta.dados);
        this.marcarSalvo();
        this.toast.sucesso('Chave validada e salva.');
      },
      error: erro => { this.form.controls.chave.reset(''); this.toast.erroServidor(erro, 'Não foi possível confirmar a operação. Atualize a tela antes de repetir; a tentativa pode ter custo.'); }
    });
  }

  async remover(): Promise<void> {
    if (!this.podeRemover() || this.processando()) return;
    const confirmado = await this.confirm.confirmar('Remover chave Google cadastrada?', 'A credencial da empresa atual será removida.', { textoConfirmar: 'Remover chave' });
    if (!confirmado || !this.podeRemover() || this.processando()) return;
    this.processando.set(true);
    this.service.remover().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível remover a chave.'); return; }
        this.configuracao.set(resposta.dados);
        this.form.controls.chave.reset('');
        this.marcarSalvo();
        this.toast.sucesso('Chave removida.');
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível remover a chave.')
    });
  }
}
