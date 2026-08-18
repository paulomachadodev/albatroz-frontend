import { Routes } from '@angular/router';

export const CONTATOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/contatos-lista/contatos-lista.component').then(m => m.ContatosListaComponent)
  }
];
