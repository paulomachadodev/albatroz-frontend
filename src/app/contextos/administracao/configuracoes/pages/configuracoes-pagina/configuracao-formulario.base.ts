import { DestroyRef, Directive, HostListener, computed, effect, inject, signal } from '@angular/core';
import { CanDeactivateFn, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';

@Directive()
export abstract class ConfiguracaoFormularioBase {
  protected readonly destroyRef = inject(DestroyRef);
  private readonly acessoFormulario = inject(AuthService);
  private readonly confirmacao = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly empresaInicial = this.acessoFormulario.empresaIdAtual();
  private readonly usuarioInicial = this.acessoFormulario.usuario()?.id;
  protected readonly contextoEncerrado = new Subject<void>();
  protected permissaoEdicao = 'configuracoes:editar';
  readonly alterado = signal(false);
  readonly contextoValido = computed(() => this.acessoFormulario.usuario()?.id === this.usuarioInicial && this.acessoFormulario.empresaIdAtual() === this.empresaInicial);
  readonly podeEditar = computed(() => this.contextoValido() && this.acessoFormulario.temPermissao(this.permissaoEdicao));

  constructor() {
    effect(() => {
      if (!this.contextoValido()) {
        this.contextoEncerrado.next();
        this.alterado.set(false);
        void this.router.navigate(['/configuracoes'], { replaceUrl: true });
      }
    });
  }

  @HostListener('input')
  @HostListener('change')
  registrarAlteracao(): void {
    if (this.podeEditar()) this.alterado.set(true);
  }

  marcarSalvo(): void {
    this.alterado.set(false);
  }

  podeSair(): boolean | Promise<boolean> {
    return !this.alterado() || this.confirmacao.confirmar('Descartar alterações?', 'Há alterações não salvas nesta configuração.', { textoConfirmar: 'Descartar e sair', textoCancelar: 'Continuar editando' });
  }

  @HostListener('window:beforeunload', ['$event'])
  protegerAlteracoes(evento: BeforeUnloadEvent): void {
    if (this.alterado()) evento.preventDefault();
  }
}

export const configuracaoAlteradaGuard: CanDeactivateFn<ConfiguracaoFormularioBase> = component => component.podeSair();
