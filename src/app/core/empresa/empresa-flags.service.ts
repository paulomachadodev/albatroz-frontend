import { Injectable, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../http/api.service';

export interface EmpresaFlags {
  tinyAtivo: boolean;
  tinyPush: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmpresaFlagsService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly _flags = signal<EmpresaFlags | null>(null);
  private empresaCarregada: number | null = null;
  private requisicao?: Subscription;
  readonly flags = this._flags.asReadonly();

  constructor() {
    effect(() => {
      this.auth.usuario();
      this.carregar();
    });
  }

  carregar(): void {
    const empresa = this.auth.empresaIdAtual();
    if (empresa === this.empresaCarregada && (this._flags() !== null || this.requisicao && !this.requisicao.closed)) return;
    this.requisicao?.unsubscribe();
    this.empresaCarregada = empresa;
    this._flags.set(null);
    if (!empresa) return;
    this.requisicao = this.api.get<EmpresaFlags>('/v1/configuracoes/flags').subscribe({
      next: res => {
        if (this.auth.empresaIdAtual() === empresa) this._flags.set(res.dados ?? { tinyAtivo: false, tinyPush: false });
      },
      error: () => {
        if (this.auth.empresaIdAtual() === empresa) this._flags.set({ tinyAtivo: false, tinyPush: false });
      }
    });
  }

  tinyAtivo(): boolean {
    return this._flags()?.tinyAtivo ?? false;
  }
}
