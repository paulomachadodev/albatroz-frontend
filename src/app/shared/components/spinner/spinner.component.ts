import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html'
})
export class SpinnerComponent {
  tamanho = input<'sm' | 'md' | 'lg'>('md');
  label = input<string>('');
  claro = input<boolean>(false);

  get classeTamanho(): string {
    switch (this.tamanho()) {
      case 'sm': return 'size-4 border-2';
      case 'lg': return 'size-8 border-4';
      default: return 'size-6 border-2';
    }
  }

  get classeCor(): string {
    return this.claro()
      ? 'border-white/40 border-t-white'
      : 'border-primary/20 border-t-primary';
  }
}
