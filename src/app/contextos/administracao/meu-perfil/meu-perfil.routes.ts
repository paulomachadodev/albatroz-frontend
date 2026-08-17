import { Routes } from '@angular/router';

export const MEU_PERFIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/meu-perfil-pagina/meu-perfil-pagina.component').then(m => m.MeuPerfilPaginaComponent)
  }
];
