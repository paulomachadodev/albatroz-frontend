import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html'
})
export class ModalComponent {
  aberto = input.required<boolean>();
  titulo = input<string>('');
  tamanho = input<'sm' | 'md' | 'lg' | '2xl'>('sm');

  fechar = output<void>();

  get classeTamanho(): string {
    switch (this.tamanho()) {
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case '2xl': return 'max-w-2xl';
      default: return 'max-w-sm';
    }
  }
}
