import { Component, signal } from '@angular/core';


@Component({
  selector: 'app-menu-dropdown',
  standalone: true,
  imports: [],
  templateUrl: './menu-dropdown.component.html',
  host: { class: 'relative inline-block' }
})
export class MenuDropdownComponent {
  aberto = signal(false);

  alternar() {
    this.aberto.update(v => !v);
  }

  fecharComAtraso() {
    setTimeout(() => this.aberto.set(false), 150);
  }

  fechar() {
    this.aberto.set(false);
  }
}
