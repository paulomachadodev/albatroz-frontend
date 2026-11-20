import { Component, inject } from '@angular/core';
import { CarregamentoPaginaService } from '../../../core/carregamento/carregamento-pagina.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-carregando-pagina',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="absolute inset-0 z-30 flex items-center justify-center bg-background-light dark:bg-background-dark transition-opacity duration-200"
         [class.opacity-100]="carregamento.visivel()"
         [class.opacity-0]="!carregamento.visivel()"
         [class.pointer-events-none]="!carregamento.visivel()"
         [attr.aria-hidden]="!carregamento.visivel()"
         role="status">
      <app-spinner tamanho="lg" label="Carregando..."></app-spinner>
    </div>
  `
})
export class CarregandoPaginaComponent {
  carregamento = inject(CarregamentoPaginaService);
}
