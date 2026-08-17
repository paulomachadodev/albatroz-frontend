import { Routes } from '@angular/router';
import { permissaoGuard } from '../../../core/auth/permissao.guard';

export const PERFIS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissaoGuard],
    data: { permissao: 'perfis:ler' },
    loadComponent: () =>
      import('./pages/perfis-lista/perfis-lista.component').then(m => m.PerfisListaComponent)
  }
];
