import { Routes } from '@angular/router';

export const ESTOQUE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/saude-estoque/saude-estoque.component').then(m => m.SaudeEstoqueComponent)
  }
];
