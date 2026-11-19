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
import { BancoImagensConfiguracao } from '../../models/banco-imagens.model';
import { BancoImagensService } from '../../services/banco-imagens.service';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';

const PADRAO_CHAVE = /^[A-Za-z0-9_-]+$/;

@Component({
  selector: 'app-configuracao-banco-imagens', standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, InputTextModule, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './banco-imagens-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class BancoImagensConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
  private readonly service = inject(BancoImagensService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  protected override permissaoEdicao = 'integracoes_sociais:editar';
  readonly carregando = signal(true);
  readonly processando = signal(false);
  readonly configuracao = signal<BancoImagensConfiguracao | null>(null);
  readonly disponivel = computed(() => this.contextoValido() && this.configuracao()?.habilitado === true);
  readonly podeRemover = computed(() => this.disponivel() && this.auth.temPermissao('integracoes_sociais:excluir') && this.configuracao()?.configurado === true);
  readonly form = this.fb.nonNullable.group({
    chaveAcesso: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(128), Validators.pattern(PADRAO_CHAVE)]],
    segredo: ['', [Validators.minLength(20), Validators.maxLength(128), Validators.pattern(PADRAO_CHAVE)]]
  });

  constructor() {
    super();
    effect(() => {
      if (!this.contextoValido()) {
        this.form.reset({ chaveAcesso: '', segredo: '' });
        this.configuracao.set(null);
      }
    });
    this.destroyRef.onDestroy(() => this.form.reset({ chaveAcesso: '', segredo: '' }));
  }

  ngOnInit(): void {
    this.service.obter().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível carregar a configuração do banco de imagens.'); return; }
        this.configuracao.set(resposta.dados);
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar a configuração do banco de imagens.')
    });
  }

  salvar(): void {
    this.form.markAllAsTouched();
    if (!this.podeEditar() || !this.disponivel() || this.processando() || this.form.invalid) return;
    this.processando.set(true);
    const { chaveAcesso, segredo } = this.form.getRawValue();
    this.service.salvar({ chaveAcesso: chaveAcesso.trim(), segredo: segredo.trim() || null, versaoEsperada: this.configuracao()?.versao ?? null })
      .pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
        next: resposta => {
          this.form.reset({ chaveAcesso: '', segredo: '' });
          if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível validar e salvar a chave.'); return; }
          this.configuracao.set(resposta.dados);
          this.marcarSalvo();
          this.toast.sucesso('Chave validada no Unsplash e salva.');
        },
        error: erro => { this.form.reset({ chaveAcesso: '', segredo: '' }); this.toast.erroServidor(erro, 'Não foi possível validar e salvar a chave.'); }
      });
  }

  async remover(): Promise<void> {
    if (!this.podeRemover() || this.processando()) return;
    const confirmado = await this.confirm.confirmar('Remover a chave do Unsplash?', 'As artes novas deixam de poder usar fotos do banco de imagens.', { textoConfirmar: 'Remover chave' });
    if (!confirmado || !this.podeRemover() || this.processando()) return;
    this.processando.set(true);
    this.service.remover().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso) { this.toast.erro('Não foi possível remover a chave.'); return; }
        this.configuracao.set({ habilitado: true, configurado: false, chaveFinal: null, segredoConfigurado: false, validadaEm: null, versao: null });
        this.form.reset({ chaveAcesso: '', segredo: '' });
        this.marcarSalvo();
        this.toast.sucesso('Chave removida.');
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível remover a chave.')
    });
  }
}
