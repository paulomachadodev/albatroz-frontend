import { Routes } from '@angular/router';
import { permissaoGuard } from '../../../core/auth/permissao.guard';

export const CONFIGURACOES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissaoGuard],
    data: { permissao: 'configuracoes:ler' },
    loadComponent: () =>
      import('./pages/configuracoes-pagina/configuracoes-pagina.component').then(m => m.ConfiguracoesPaginaComponent)
  }
];
