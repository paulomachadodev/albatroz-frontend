import { Routes } from '@angular/router';

export const COTACAO_CONFIGURACOES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/configuracoes-pagina/configuracoes-pagina.component').then(m => m.CotacaoConfiguracoesPaginaComponent)
  }
];
