import { Routes } from '@angular/router';

export const DDA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dda-lista/dda-lista.component').then(m => m.DdaListaComponent)
  },
  {
    path: ':importacaoId',
    loadComponent: () =>
      import('./pages/dda-detalhe/dda-detalhe.component').then(m => m.DdaDetalheComponent)
  }
];
