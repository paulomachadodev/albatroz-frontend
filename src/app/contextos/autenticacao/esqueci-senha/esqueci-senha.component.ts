
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './esqueci-senha.component.html'
})
export class EsqueciSenhaComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  carregando = signal(false);
  enviado    = signal(false);
  erro       = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email:     ['', [Validators.required, Validators.email]],
    empresaId: [1, [Validators.required, Validators.min(1)]]
  });

  submeter(): void {
    this.erro.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando.set(true);
    const { email, empresaId } = this.form.getRawValue();

    this.auth.esqueciSenha(email, empresaId).subscribe({
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
