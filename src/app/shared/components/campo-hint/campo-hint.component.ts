import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campo-hint',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campo-hint.component.html',
  host: { class: 'inline-block relative' }
})
export class CampoHintComponent {
  texto = input.required<string>();
  aberto = signal(false);
}
