import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private contador = 0;

  travar() {
    this.contador++;
    if (this.contador === 1) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('scroll-bloqueado');
    }
  }

  destravar() {
    this.contador = Math.max(0, this.contador - 1);
    if (this.contador === 0) {
      document.body.style.overflow = '';
      document.body.classList.remove('scroll-bloqueado');
    }
  }
}
