import { Routes } from '@angular/router';
import { permissaoGuard } from '../../../core/auth/permissao.guard';

export const NATUREZAS_OPERACAO_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissaoGuard],
    data: { permissao: 'configuracoes:ler' },
    loadComponent: () =>
      import('./pages/naturezas-lista/naturezas-lista.component').then(m => m.NaturezasListaComponent)
  },
  {
    path: 'nova',
    canActivate: [permissaoGuard],
    data: { permissao: 'configuracoes:criar' },
    loadComponent: () =>
      import('./pages/natureza-editor/natureza-editor.component').then(m => m.NaturezaEditorComponent)
  },
  {
    path: ':id',
    canActivate: [permissaoGuard],
    data: { permissao: 'configuracoes:ler' },
    loadComponent: () =>
      import('./pages/natureza-editor/natureza-editor.component').then(m => m.NaturezaEditorComponent)
  }
];
