import { Routes } from '@angular/router';

export const ETL_ROUTES: Routes = [
  {
    path: 'tiny',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/etl-visao-geral-page/etl-visao-geral-page.component').then(m => m.EtlVisaoGeralPageComponent),
        title: 'ETL — Visão Geral'
      },
      {
        path: ':entidade',
        loadComponent: () =>
          import('./pages/etl-contexto-page/etl-contexto-page.component').then(m => m.EtlContextoPageComponent),
        title: 'ETL — Contexto'
      }
    ]
  },
  { path: '', redirectTo: 'tiny', pathMatch: 'full' }
];
