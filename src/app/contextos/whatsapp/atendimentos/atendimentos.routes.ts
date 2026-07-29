import { Routes } from '@angular/router';

export const ATENDIMENTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/atendimentos-dashboard/atendimentos-dashboard.component').then(m => m.AtendimentosDashboardComponent)
  }
];
