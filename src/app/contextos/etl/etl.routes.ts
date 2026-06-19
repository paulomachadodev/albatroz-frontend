import { Routes } from '@angular/router';

export const ETL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/etl-painel/etl-painel.component').then(m => m.EtlPainelComponent)
  }
];
