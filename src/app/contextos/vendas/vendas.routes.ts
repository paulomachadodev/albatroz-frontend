import { Routes } from '@angular/router';

export const VENDAS_ROUTES: Routes = [
  {
    path: 'por-forma-pagamento',
    loadComponent: () =>
      import('./pages/vendas-por-forma-pagamento/vendas-por-forma-pagamento.component').then(m => m.VendasPorFormaPagamentoComponent)
  }
];
