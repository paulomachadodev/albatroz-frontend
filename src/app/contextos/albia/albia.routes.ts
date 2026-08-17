import { Routes } from '@angular/router';

export const ALBIA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/chat/chat.component').then(m => m.AlbiaChatComponent)
  }
];
