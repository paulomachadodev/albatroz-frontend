import { Routes } from '@angular/router';
import { permissaoGuard } from '../../core/auth/permissao.guard';
import { configuracaoAlteradaGuard } from '../administracao/configuracoes/pages/configuracoes-pagina/configuracao-formulario.base';

export const MARKETING_ROUTES: Routes = [
  { path: 'briefings/:id/geracoes', canActivate: [permissaoGuard], data: { permissao: 'marketing:ler' }, title: 'Gerações de texto', loadComponent: () => import('./pages/geracoes-briefing/geracoes-briefing.component').then(m => m.GeracoesBriefingComponent) },
  { path: 'pecas/:id', canActivate: [permissaoGuard], canDeactivate: [configuracaoAlteradaGuard], data: { permissao: 'marketing:ler' }, title: 'Peça de conteúdo', loadComponent: () => import('./pages/peca-editor/peca-editor.component').then(m => m.PecaEditorComponent) },
  { path: 'pecas', canActivate: [permissaoGuard], data: { permissao: 'marketing:ler' }, title: 'Peças de conteúdo', loadComponent: () => import('./pages/pecas-lista/pecas-lista.component').then(m => m.PecasListaComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'estrategia' },
  {
    path: 'estrategia',
    canActivate: [permissaoGuard],
    canDeactivate: [configuracaoAlteradaGuard],
    data: { permissao: 'marketing:ler' },
    title: 'Estratégia editorial',
    loadComponent: () => import('./pages/estrategia-editorial/estrategia-editorial.component').then(m => m.EstrategiaEditorialComponent)
  },
  {
    path: 'briefings',
    canActivate: [permissaoGuard],
    data: { permissao: 'marketing:ler' },
    title: 'Briefings',
    loadComponent: () => import('./pages/briefings-lista/briefings-lista.component').then(m => m.BriefingsListaComponent)
  }
];
