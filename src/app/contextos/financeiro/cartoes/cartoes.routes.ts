import { Routes } from '@angular/router';

export const CARTOES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./cartoes-dashboard/cartoes-dashboard.component').then(m => m.CartoesDashboardComponent)
  },
  {
    path: 'upload',
    loadComponent: () =>
      import('./fatura-upload/fatura-upload.component').then(m => m.FaturaUploadComponent)
  }
];
