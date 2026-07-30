import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  host: { class: 'block' }
})
export class PageHeaderComponent {
  titulo = input.required<string>();
  subtitulo = input<string>('');
}
