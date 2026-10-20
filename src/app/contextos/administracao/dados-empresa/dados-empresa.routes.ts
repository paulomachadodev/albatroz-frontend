import { Routes } from '@angular/router';
import { permissaoGuard } from '../../../core/auth/permissao.guard';

export const DADOS_EMPRESA_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissaoGuard],
    data: { permissao: 'configuracoes:ler' },
    loadComponent: () =>
      import('./pages/dados-empresa/dados-empresa.component').then(m => m.DadosEmpresaComponent)
  }
];
