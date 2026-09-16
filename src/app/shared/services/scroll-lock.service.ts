import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private contador = 0;

  travar() {
    this.contador++;
    if (this.contador === 1) document.body.style.overflow = 'hidden';
  }

  destravar() {
    this.contador = Math.max(0, this.contador - 1);
    if (this.contador === 0) document.body.style.overflow = '';
  }
}
