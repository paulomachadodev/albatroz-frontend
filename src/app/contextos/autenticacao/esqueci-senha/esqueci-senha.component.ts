
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LogoBadgeComponent } from '../../../shared/components/logo-badge/logo-badge.component';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoBadgeComponent],
  templateUrl: './esqueci-senha.component.html'
})
export class EsqueciSenhaComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  carregando = signal(false);
  enviado    = signal(false);
  erro       = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email:     ['', [Validators.required, Validators.email]]
  });

  submeter(): void {
    this.erro.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando.set(true);
    const { email } = this.form.getRawValue();

    this.auth.esqueciSenha(email).subscribe({
      next: () => {
        this.carregando.set(false);
        this.enviado.set(true);
      },
      error: () => {
        this.carregando.set(false);
        this.enviado.set(true);
      }
    });
  }
}
