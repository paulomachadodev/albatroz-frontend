import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../http/api.service';

export interface EmpresaFlags {
  tinyAtivo: boolean;
  tinyPush:  boolean;
}

@Injectable({ providedIn: 'root' })
export class EmpresaFlagsService {
  private api = inject(ApiService);

  private _flags = signal<EmpresaFlags | null>(null);
  readonly flags = this._flags.asReadonly();

  carregar(): void {
    if (this._flags() !== null) return;
    this.api.get<EmpresaFlags>('/v1/configuracoes/flags').subscribe({
      next: res => this._flags.set(res.dados ?? { tinyAtivo: false, tinyPush: false }),
      error: ()  => this._flags.set({ tinyAtivo: false, tinyPush: false })
    });
  }

  tinyAtivo(): boolean {
    return this._flags()?.tinyAtivo ?? false;
  }
}
