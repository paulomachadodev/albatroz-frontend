import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastContainerComponent } from '../../core/feedback/toast-container.component';
import { ConfirmDialogComponent } from '../../core/feedback/confirm-dialog.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastContainerComponent, ConfirmDialogComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <app-sidebar></app-sidebar>
      <div class="flex-1 flex flex-col min-w-0">
        <router-outlet></router-outlet>
      </div>
    </div>
    <app-toast-container></app-toast-container>
    <app-confirm-dialog></app-confirm-dialog>
  `
})
export class ShellComponent {}
