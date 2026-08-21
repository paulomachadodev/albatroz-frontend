import { Component, input, signal } from '@angular/core';


@Component({
  selector: 'app-campo-hint',
  standalone: true,
  imports: [],
  templateUrl: './campo-hint.component.html',
  host: { class: 'inline-block relative' }
})
export class CampoHintComponent {
  texto = input.required<string>();
  aberto = signal(false);
}
