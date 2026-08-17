import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('novaSenha')?.value;
  const confirmacao = control.get('confirmacao')?.value;
  return senha && confirmacao && senha !== confirmacao ? { senhasDiferentes: true } : null;
}

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './redefinir-senha.component.html'
})
export class RedefinirSenhaComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  private token = this.route.snapshot.queryParamMap.get('token') ?? '';

  carregando = signal(false);
  concluido  = signal(false);
  erro       = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    novaSenha:    ['', [Validators.required, Validators.minLength(8)]],
    confirmacao:  ['', [Validators.required]]
  }, { validators: senhasIguaisValidator });

  submeter(): void {
    this.erro.set(null);

    if (!this.token) {
      this.erro.set('Link inválido. Solicite uma nova recuperação de senha.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    const { novaSenha } = this.form.getRawValue();

    this.auth.redefinirSenha(this.token, novaSenha).subscribe({
      next: () => {
        this.carregando.set(false);
        this.concluido.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(err.error?.detail ?? 'Não foi possível redefinir a senha. O link pode ter expirado.');
      }
    });
  }
}
