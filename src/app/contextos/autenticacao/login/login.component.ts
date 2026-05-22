import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb       = inject(FormBuilder);
  private auth     = inject(AuthService);
  private router   = inject(Router);

  carregando = signal(false);
  erro       = signal<string | null>(null);
  mostrarSenha = signal(false);

  form = this.fb.nonNullable.group({
    email:     ['', [Validators.required]],
    senha:     ['', [Validators.required, Validators.minLength(4)]],
    empresaId: [1, [Validators.required, Validators.min(1)]],
    lembrar:   [true]
  });

  toggleSenha(): void {
    this.mostrarSenha.update(v => !v);
  }

  submeter(): void {
    this.erro.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando.set(true);

    const { email, senha, empresaId } = this.form.getRawValue();

    this.auth.login({ email, senha, empresaId }).subscribe({
      next: () => {
        this.carregando.set(false);
        const ret = new URLSearchParams(window.location.search).get('returnUrl');
        this.router.navigateByUrl(ret ?? '/dashboard');
      },
      error: (err) => {
        this.carregando.set(false);
        const msg = err?.error?.mensagem ?? err?.error?.erro ?? null;
        this.erro.set(msg ?? 'E-mail ou senha incorretos. Tente novamente.');
      }
    });
  }
}
