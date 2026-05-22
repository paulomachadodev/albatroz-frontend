import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex min-h-screen bg-slate-50">
      <app-sidebar [colapsada]="colapsada()" (toggle)="alternar()"></app-sidebar>
      <div class="flex-1 flex flex-col min-w-0">
        <app-header></app-header>
        <main class="flex-1 p-6 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class ShellComponent {
  colapsada = signal(false);
  alternar(): void { this.colapsada.update(v => !v); }
}
