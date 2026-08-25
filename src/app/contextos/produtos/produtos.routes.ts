import { Routes } from '@angular/router';

export const PRODUTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/produtos-lista/produtos-lista.component').then(m => m.ProdutosListaComponent)
  },
  {
    path: 'importar-imagens',
    loadComponent: () =>
      import('./pages/produtos-importar-imagens/produtos-importar-imagens.component').then(m => m.ProdutosImportarImagensComponent)
  },
  {
    path: 'revisar-imagens',
    loadComponent: () =>
      import('./pages/produtos-revisar-imagens/produtos-revisar-imagens.component').then(m => m.ProdutosRevisarImagensComponent)
  },
  {
    path: 'marcas',
    loadComponent: () =>
      import('./pages/marcas-lista/marcas-lista.component').then(m => m.MarcasListaComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/produtos-detalhe/produtos-detalhe.component').then(m => m.ProdutosDetalheComponent)
  }
];
