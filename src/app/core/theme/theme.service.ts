import { Injectable, effect, inject } from '@angular/core';
import { ApiService } from '../http/api.service';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../feedback/toast.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  constructor() {
    effect(() => {
      const tema = this.auth.usuario()?.temaPreferido ?? 'light';
      document.documentElement.classList.toggle('dark', tema === 'dark');
    });
  }

  temaAtual(): 'light' | 'dark' {
    return this.auth.usuario()?.temaPreferido ?? 'light';
  }

  alternar(): void {
    const proximo: 'light' | 'dark' = this.temaAtual() === 'dark' ? 'light' : 'dark';
    const anterior = this.temaAtual() === 'dark' ? 'light' : 'dark';
    this.auth.definirTemaLocal(proximo);
    this.api.put<void>('/v1/usuarios/meu-tema', { tema: proximo }).subscribe({
      error: err => {
        // Reverte localmente — se não persistiu no servidor, não pode parecer que persistiu:
        // próximo login (outra aba, outro dispositivo) voltaria pro tema antigo sem aviso.
        this.auth.definirTemaLocal(anterior);
        this.toast.erroServidor(err, 'Não foi possível salvar sua preferência de tema.');
      }
    });
  }
}
