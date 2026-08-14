import { Routes } from '@angular/router';

export const EMPRESAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/empresas-lista/empresas-lista.component').then(m => m.EmpresasListaComponent)
  }
];
