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
  }
];
