import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  empresaId = signal<number | null>(null);

  constructor() {
    this.carregarDoJwt();
  }

  private carregarDoJwt(): void {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = JSON.parse(atob(token.split('.')[1]));
      this.empresaId.set(payload.empresa_id || null);
    } catch (e) {
      console.error('Erro ao decodificar JWT:', e);
      this.empresaId.set(null);
    }
  }
}
