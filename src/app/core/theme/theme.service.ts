import { Injectable, effect, inject } from '@angular/core';
import { ApiService } from '../http/api.service';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private auth = inject(AuthService);
  private api = inject(ApiService);

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
    this.auth.definirTemaLocal(proximo);
    this.api.put<void>('/v1/usuarios/meu-tema', { tema: proximo }).subscribe({
      error: () => void 0
    });
  }
}
