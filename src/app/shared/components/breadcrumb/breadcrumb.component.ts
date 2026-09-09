import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  rota?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html'
})
export class BreadcrumbComponent {
  private location = inject(Location);

  itens = input.required<BreadcrumbItem[]>();
  aoVoltar = input<() => void>();

  voltar(): void {
    const handler = this.aoVoltar();
    if (handler) {
      handler();
      return;
    }
    this.location.back();
  }
}
