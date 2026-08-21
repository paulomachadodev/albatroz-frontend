import { Component, input, output } from '@angular/core';


@Component({
  selector: 'app-btn-icone',
  standalone: true,
  imports: [],
  templateUrl: './btn-icone.component.html',
  host: { class: 'inline-block' }
})
export class BtnIconeComponent {
  icone = input.required<string>();
  titulo = input<string>('');
  variante = input<'neutro' | 'perigo'>('neutro');
  desabilitado = input<boolean>(false);

  clicar = output<void>();
}
