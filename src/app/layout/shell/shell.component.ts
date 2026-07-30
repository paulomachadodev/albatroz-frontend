import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastContainerComponent } from '../../core/feedback/toast-container.component';
import { ConfirmDialogComponent } from '../../core/feedback/confirm-dialog.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastContainerComponent, ConfirmDialogComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <app-sidebar [colapsada]="colapsada()" (toggle)="alternar()"></app-sidebar>
      <div class="flex-1 flex flex-col min-w-0">
        <app-header></app-header>
        <router-outlet></router-outlet>
      </div>
    </div>
    <app-toast-container></app-toast-container>
    <app-confirm-dialog></app-confirm-dialog>
  `
})
export class ShellComponent {
  colapsada = signal(false);
  alternar(): void { this.colapsada.update(v => !v); }
}
