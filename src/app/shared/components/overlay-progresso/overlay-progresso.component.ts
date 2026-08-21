import { Component, computed, input } from '@angular/core';


@Component({
  selector: 'app-overlay-progresso',
  standalone: true,
  imports: [],
  templateUrl: './overlay-progresso.component.html'
})
export class OverlayProgressoComponent {
  visivel = input.required<boolean>();
  mensagem = input<string>('Processando...');
  concluidas = input<number>(0);
  total = input<number>(0);

  percentual = computed(() => this.total() > 0 ? Math.round((this.concluidas() / this.total()) * 100) : 0);
}
