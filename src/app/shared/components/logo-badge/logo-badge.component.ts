import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo-badge',
  standalone: true,
  template: `
    <div class="rounded-lg bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center shrink-0"
         [class.size-8]="tamanho() === 'sm'" [class.size-9]="tamanho() === 'md'"
         [class.shadow-md]="comSombra()">
      <img src="/logo/albatroz-icon.svg" alt="Albatroz" class="size-5" />
    </div>
  `
})
export class LogoBadgeComponent {
  tamanho = input<'sm' | 'md'>('md');
  comSombra = input(false);
}
