import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toggle.component.html',
  host: { class: 'inline-flex items-center gap-2' }
})
export class ToggleComponent {
  valor = input<boolean>(false);
  label = input<string>('');
  desabilitado = input<boolean>(false);
  valorMudou = output<boolean>();

  alternar() {
    if (this.desabilitado()) return;
    this.valorMudou.emit(!this.valor());
  }
}
