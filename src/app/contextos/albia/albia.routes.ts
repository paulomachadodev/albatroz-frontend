import { Routes } from '@angular/router';

export const ALBIA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/configuracoes/configuracoes.component').then(m => m.AlbiaConfiguracoesComponent)
  }
];
