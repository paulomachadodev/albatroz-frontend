import { Routes } from '@angular/router';

export const SERIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/series-lista/series-lista.component').then(m => m.SeriesListaComponent)
  }
];
