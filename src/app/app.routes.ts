import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AUTENTICACAO_ROUTES } from './contextos/autenticacao/autenticacao.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  ...AUTENTICACAO_ROUTES,

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
        path: 'cotacoes/listas-escolares',
        loadChildren: () =>
          import('./contextos/cotacao/listas-escolares/listas-escolares.routes').then(m => m.LISTAS_ESCOLARES_ROUTES)
      },
      {
        path: 'cotacoes/configuracoes',
        loadChildren: () =>
          import('./contextos/cotacao/configuracoes/configuracoes.routes').then(m => m.COTACAO_CONFIGURACOES_ROUTES)
      },
      {
        path: 'cadastros/escolas',
        loadChildren: () =>
          import('./contextos/cadastros/escolas/escolas.routes').then(m => m.ESCOLAS_ROUTES)
      },
      {
        path: 'cadastros/series',
        loadChildren: () =>
          import('./contextos/cadastros/series/series.routes').then(m => m.SERIES_ROUTES)
      },
      {
        path: 'cadastros/empresas',
        loadChildren: () =>
          import('./contextos/cadastros/empresas/empresas.routes').then(m => m.EMPRESAS_ROUTES)
      },
      {
        path: 'whatsapp/atendimentos',
        loadChildren: () =>
          import('./contextos/whatsapp/atendimentos/atendimentos.routes').then(m => m.ATENDIMENTOS_ROUTES)
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
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./contextos/administracao/usuarios/usuarios.routes').then(m => m.USUARIOS_ROUTES)
      },
      {
        path: 'perfis',
        loadChildren: () =>
          import('./contextos/administracao/perfis/perfis.routes').then(m => m.PERFIS_ROUTES)
      },
      {
        path: 'configuracoes',
        loadChildren: () =>
          import('./contextos/administracao/configuracoes/configuracoes.routes').then(m => m.CONFIGURACOES_ROUTES)
      },
      {
        path: 'meu-perfil',
        loadChildren: () =>
          import('./contextos/administracao/meu-perfil/meu-perfil.routes').then(m => m.MEU_PERFIL_ROUTES)
      }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];
