import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-teclado-numerico',
  standalone: true,
  templateUrl: './teclado-numerico.component.html',
  host: { class: 'block w-full' }
})
export class TecladoNumericoComponent {
  valor = input.required<string>();
  permiteDecimal = input(false);
  desabilitado = input(false);

  valorChange = output<string>();

  readonly teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  aoTocarTecla(tecla: string) {
    if (this.desabilitado()) return;
    this.valorChange.emit(this.valor() + tecla);
  }

  aoTocarDecimal() {
    if (this.desabilitado() || !this.permiteDecimal()) return;
    if (this.valor().includes(',')) return;
    this.valorChange.emit((this.valor() || '0') + ',');
  }

  apagar() {
    if (this.desabilitado()) return;
    this.valorChange.emit(this.valor().slice(0, -1));
  }
}
