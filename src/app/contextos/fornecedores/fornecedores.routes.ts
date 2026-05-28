import { Routes } from '@angular/router';

export const FORNECEDORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./fornecedores.component').then(m => m.FornecedoresComponent)
  }
];
