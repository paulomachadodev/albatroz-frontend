import { Routes } from '@angular/router';

export const CONTAS_PAGAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/contas-pagar-lista/contas-pagar-lista.component').then(m => m.ContasPagarListaComponent)
  }
];
