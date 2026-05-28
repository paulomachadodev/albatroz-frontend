import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export type TipoToast = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  titulo: string;
  mensagem?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  sucesso(titulo: string, mensagem?: string) { this.adicionar('sucesso', titulo, mensagem); }
  erro(titulo: string, mensagem?: string)    { this.adicionar('erro', titulo, mensagem); }
  aviso(titulo: string, mensagem?: string)   { this.adicionar('aviso', titulo, mensagem); }
  info(titulo: string, mensagem?: string)    { this.adicionar('info', titulo, mensagem); }

  /** Extrai a mensagem exata do servidor (ProblemDetails.detail) e exibe como toast de erro. */
  erroServidor(err: unknown, fallback = 'Ocorreu um erro inesperado.') {
    this.erro('Erro', this.mensagemServidor(err, fallback));
  }

  mensagemServidor(err: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
    if (err instanceof HttpErrorResponse) {
      const corpo = err.error;
      return corpo?.detail ?? corpo?.mensagem ?? corpo?.title ?? err.message ?? fallback;
    }
    return fallback;
  }

  remover(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private adicionar(tipo: TipoToast, titulo: string, mensagem?: string) {
    const id = ++this.seq;
    this.toasts.update(list => [...list, { id, tipo, titulo, mensagem }]);
    setTimeout(() => this.remover(id), 5000);
  }
}
