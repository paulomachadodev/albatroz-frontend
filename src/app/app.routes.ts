import { Routes } from '@angular/router';
import { authGuard, dashboardAccessGuard, publicoGuard } from './core/auth/auth.guard';
import { AUTENTICACAO_ROUTES } from './contextos/autenticacao/autenticacao.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [publicoGuard],
    loadComponent: () =>
      import('./contextos/landing/pages/landing/landing.component').then(m => m.LandingComponent)
  },

  ...AUTENTICACAO_ROUTES,

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        canActivate: [dashboardAccessGuard],
        loadChildren: () =>
          import('./contextos/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'produtos',
        loadChildren: () =>
          import('./contextos/produtos/produtos.routes').then(m => m.PRODUTOS_ROUTES)
      },
      {
        path: 'compras',
        loadChildren: () =>
          import('./contextos/compras/compras.routes').then(m => m.COMPRAS_ROUTES)
      },
      {
        path: 'estoque',
        loadChildren: () =>
          import('./contextos/estoque/estoque.routes').then(m => m.ESTOQUE_ROUTES)
      },
      {
        path: 'balanco',
        loadChildren: () =>
          import('./contextos/balanco/balanco.routes').then(m => m.BALANCO_ROUTES)
      },
      {
        path: 'albia',
        loadChildren: () =>
          import('./contextos/albia/albia.routes').then(m => m.ALBIA_ROUTES)
      },
      {
        path: 'cadastros/contatos',
        loadChildren: () =>
          import('./contextos/cadastros/contatos/contatos.routes').then(m => m.CONTATOS_ROUTES)
      },
      {
        path: 'cotacoes/listas-escolares',
        loadChildren: () =>
          import('./contextos/cotacao/listas-escolares/listas-escolares.routes').then(m => m.LISTAS_ESCOLARES_ROUTES)
      },
      {
        path: 'cotacoes/configuracoes',
        redirectTo: 'configuracoes'
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
        redirectTo: 'configuracoes/dados-empresa'
      },
      {
        path: 'configuracoes/dados-empresa',
        loadChildren: () =>
          import('./contextos/administracao/dados-empresa/dados-empresa.routes').then(m => m.DADOS_EMPRESA_ROUTES)
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
        path: 'financeiro/contas-pagar',
        loadChildren: () =>
          import('./contextos/financeiro/contas-pagar/contas-pagar.routes').then(m => m.CONTAS_PAGAR_ROUTES)
      },
      {
        path: 'vendas',
        loadChildren: () =>
          import('./contextos/vendas/vendas.routes').then(m => m.VENDAS_ROUTES)
      },
      {
        path: 'fiscal/naturezas-operacao',
        loadChildren: () =>
          import('./contextos/fiscal/naturezas-operacao/naturezas-operacao.routes').then(m => m.NATUREZAS_OPERACAO_ROUTES)
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
