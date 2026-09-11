import { Routes } from '@angular/router';

export const ESTOQUE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/estoque-dashboard/estoque-dashboard.component').then(m => m.EstoqueDashboardComponent)
  },
  {
    path: 'sem-giro',
    data: { categoria: 'sem-giro' },
    loadComponent: () =>
      import('./pages/estoque-listagem/estoque-listagem.component').then(m => m.EstoqueListagemComponent)
  },
  {
    path: 'candidatos-parar-comprar',
    data: { categoria: 'candidatos-parar-comprar' },
    loadComponent: () =>
      import('./pages/estoque-listagem/estoque-listagem.component').then(m => m.EstoqueListagemComponent)
  },
  {
    path: 'candidatos-inativacao',
    data: { categoria: 'candidatos-inativacao' },
    loadComponent: () =>
      import('./pages/estoque-listagem/estoque-listagem.component').then(m => m.EstoqueListagemComponent)
  },
  {
    path: 'criticos',
    data: { categoria: 'criticos' },
    loadComponent: () =>
      import('./pages/estoque-listagem/estoque-listagem.component').then(m => m.EstoqueListagemComponent)
  }
];
