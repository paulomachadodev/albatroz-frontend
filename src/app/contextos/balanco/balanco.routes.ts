import { Routes } from '@angular/router';

export const BALANCO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/balanco-dashboard/balanco-dashboard.component').then(m => m.BalancoDashboardComponent)
  },
  {
    path: 'planilha',
    loadComponent: () =>
      import('./pages/planilha/contagem-estoque.component').then(m => m.ContagemEstoqueComponent)
  },
  {
    path: 'planilha/revisao',
    loadComponent: () =>
      import('./pages/planilha-revisao/contagem-revisao.component').then(m => m.ContagemRevisaoComponent)
  },
  {
    path: 'guiada',
    loadComponent: () =>
      import('./pages/guiada-inicio/contagem-guiada-inicio.component').then(m => m.ContagemGuiadaInicioComponent)
  },
  {
    path: 'guiada/:idSessao',
    loadComponent: () =>
      import('./pages/guiada-bipagem/contagem-guiada-bipagem.component').then(m => m.ContagemGuiadaBipagemComponent)
  },
  {
    path: 'sessoes',
    loadComponent: () =>
      import('./pages/sessoes-lista/contagem-sessoes-lista.component').then(m => m.ContagemSessoesListaComponent)
  }
];
