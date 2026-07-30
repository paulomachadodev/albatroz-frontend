import { Injectable, signal } from '@angular/core';

export interface ConfirmState {
  titulo: string;
  mensagem?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly estado = signal<ConfirmState | null>(null);
  private resolver?: (valor: boolean) => void;

  confirmar(
    titulo: string,
    mensagem?: string,
    opcoes?: { textoConfirmar?: string; textoCancelar?: string }
  ): Promise<boolean> {
    this.resolver?.(false);
    this.estado.set({ titulo, mensagem, ...opcoes });
    return new Promise(resolve => (this.resolver = resolve));
  }

  responder(valor: boolean): void {
    this.resolver?.(valor);
    this.resolver = undefined;
    this.estado.set(null);
  }
}
