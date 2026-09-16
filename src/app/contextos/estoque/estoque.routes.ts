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
  },
  {
    path: 'em-ruptura',
    data: { categoria: 'em-ruptura' },
    loadComponent: () =>
      import('./pages/estoque-listagem/estoque-listagem.component').then(m => m.EstoqueListagemComponent)
  },
  {
    path: 'aging/:faixa',
    data: { categoria: 'aging' },
    loadComponent: () =>
      import('./pages/estoque-listagem/estoque-listagem.component').then(m => m.EstoqueListagemComponent)
  },
  {
    path: 'contagem',
    loadComponent: () =>
      import('./pages/contagem-estoque/contagem-estoque.component').then(m => m.ContagemEstoqueComponent)
  },
  {
    path: 'contagem/revisao',
    loadComponent: () =>
      import('./pages/contagem-revisao/contagem-revisao.component').then(m => m.ContagemRevisaoComponent)
  },
  {
    path: 'contagem/guiada',
    loadComponent: () =>
      import('./pages/contagem-guiada-inicio/contagem-guiada-inicio.component').then(m => m.ContagemGuiadaInicioComponent)
  },
  {
    path: 'contagem/guiada/:idSessao',
    loadComponent: () =>
      import('./pages/contagem-guiada-bipagem/contagem-guiada-bipagem.component').then(m => m.ContagemGuiadaBipagemComponent)
  },
  {
    path: 'contagem/sessoes',
    loadComponent: () =>
      import('./pages/contagem-sessoes-lista/contagem-sessoes-lista.component').then(m => m.ContagemSessoesListaComponent)
  }
];
