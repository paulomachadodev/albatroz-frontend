import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AUTENTICACAO_ROUTES } from './contextos/autenticacao/autenticacao.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // Autenticação (público)
  ...AUTENTICACAO_ROUTES,

  // Área autenticada — envolvida pelo Shell (sidebar + header)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./contextos/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'produtos',
        loadChildren: () =>
          import('./contextos/produtos/produtos.routes').then(m => m.PRODUTOS_ROUTES)
      },
      {
        path: 'albia',
        loadChildren: () =>
          import('./contextos/albia/albia.routes').then(m => m.ALBIA_ROUTES)
      },
      {
        path: 'fornecedores',
        loadChildren: () =>
          import('./contextos/fornecedores/fornecedores.routes').then(m => m.FORNECEDORES_ROUTES)
      },
      {
        path: 'financeiro/cartoes',
        loadChildren: () =>
          import('./contextos/financeiro/cartoes/cartoes.routes').then(m => m.CARTOES_ROUTES)
      },
      {
        path: 'integracoes',
        loadChildren: () =>
          import('./contextos/etl/etl.routes').then(m => m.ETL_ROUTES)
      }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];
