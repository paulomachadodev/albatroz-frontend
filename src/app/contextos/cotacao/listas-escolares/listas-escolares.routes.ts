import { Routes } from '@angular/router';

export const LISTAS_ESCOLARES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/listas-lista/listas-lista.component').then(m => m.ListasListaComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/lista-detalhe/lista-detalhe.component').then(m => m.ListaDetalheComponent)
  }
];
