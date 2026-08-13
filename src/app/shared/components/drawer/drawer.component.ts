import { Component, HostListener, OnDestroy, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer.component.html'
})
export class DrawerComponent implements OnDestroy {
  aberto = input.required<boolean>();
  titulo = input<string>('');
  conteudoSemPadding = input(false);

  fechar = output<void>();

  constructor() {
    effect(() => {
      document.body.style.overflow = this.aberto() ? 'hidden' : '';
    });
  }

  @HostListener('document:keydown.escape')
  aoPressionarEsc() {
    if (this.aberto()) this.fechar.emit();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}
