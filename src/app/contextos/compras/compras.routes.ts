import { Routes } from '@angular/router';

export const COMPRAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/compras-lista/compras-lista.component').then(m => m.ComprasListaComponent)
  },
  {
    path: 'pedidos',
    loadComponent: () =>
      import('./pages/pedidos-compra-lista/pedidos-compra-lista.component').then(m => m.PedidosCompraListaComponent)
  },
  {
    path: 'pedidos/:id',
    loadComponent: () =>
      import('./pages/pedido-compra-detalhe/pedido-compra-detalhe.component').then(m => m.PedidoCompraDetalheComponent)
  },
  {
    path: 'fornecedores',
    loadComponent: () =>
      import('./pages/fornecedores-painel/fornecedores-painel.component').then(m => m.FornecedoresPainelComponent)
  },
  {
    path: 'notas-entrada',
    loadComponent: () =>
      import('./pages/notas-entrada-lista/notas-entrada-lista.component').then(m => m.NotasEntradaListaComponent)
  },
  {
    path: 'notas-entrada/:id',
    loadComponent: () =>
      import('./pages/nota-entrada-detalhe/nota-entrada-detalhe.component').then(m => m.NotaEntradaDetalheComponent)
  },
  {
    path: 'notas-entrada/:id/conferencia',
    loadComponent: () =>
      import('./pages/nota-entrada-conferencia/nota-entrada-conferencia.component').then(m => m.NotaEntradaConferenciaComponent)
  },
  {
    path: 'ctes',
    loadComponent: () =>
      import('./pages/ctes-lista/ctes-lista.component').then(m => m.CtesListaComponent)
  },
  {
    path: 'ctes/:id',
    loadComponent: () =>
      import('./pages/cte-detalhe/cte-detalhe.component').then(m => m.CteDetalheComponent)
  },
  {
    path: 'manifestacao',
    loadComponent: () =>
      import('./pages/manifestacao-nfe/manifestacao-nfe.component').then(m => m.ManifestacaoNfeComponent)
  }
];
