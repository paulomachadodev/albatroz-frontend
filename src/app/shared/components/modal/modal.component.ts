import { Component, HostListener, OnDestroy, effect, input, output } from '@angular/core';

export type TamanhoModal = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  styles: [`
    :host ::ng-deep [modalRodape] { display: contents; }
  `]
})
export class ModalComponent implements OnDestroy {
  aberto = input.required<boolean>();
  titulo = input<string>('');
  subtitulo = input<string>('');
  tamanho = input<TamanhoModal>('md');
  fecharAoClicarFora = input(true);

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

  aoClicarNoFundo() {
    if (this.fecharAoClicarFora()) this.fechar.emit();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  get classeTamanho(): string {
    switch (this.tamanho()) {
      case 'sm': return 'max-w-sm';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '4xl': return 'max-w-4xl';
      default: return 'max-w-md';
    }
  }
}
