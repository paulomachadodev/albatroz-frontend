import { Routes } from '@angular/router';

export const ESCOLAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/escolas-lista/escolas-lista.component').then(m => m.EscolasListaComponent)
  }
];
