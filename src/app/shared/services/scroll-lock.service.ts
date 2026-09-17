import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private contador = 0;
  private scrollYAoTravar = 0;

  private ehMobile(): boolean {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  travar() {
    this.contador++;
    if (this.contador !== 1) return;

    document.body.classList.add('scroll-bloqueado');
    document.documentElement.classList.add('scroll-bloqueado');

    if (this.ehMobile()) {
      this.scrollYAoTravar = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollYAoTravar}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  destravar() {
    this.contador = Math.max(0, this.contador - 1);
    if (this.contador !== 0) return;

    document.body.classList.remove('scroll-bloqueado');
    document.documentElement.classList.remove('scroll-bloqueado');

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';

    if (this.ehMobile()) window.scrollTo(0, this.scrollYAoTravar);
  }
}
