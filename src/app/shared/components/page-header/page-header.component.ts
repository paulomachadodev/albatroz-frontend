import { Component, input } from '@angular/core';


@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [],
  templateUrl: './page-header.component.html',
  host: { class: 'block' }
})
export class PageHeaderComponent {
  titulo = input.required<string>();
  subtitulo = input<string>('');
}
