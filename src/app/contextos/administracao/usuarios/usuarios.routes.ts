import { Routes } from '@angular/router';
import { permissaoGuard } from '../../../core/auth/permissao.guard';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissaoGuard],
    data: { permissao: 'usuarios:ler' },
    loadComponent: () =>
      import('./pages/usuarios-lista/usuarios-lista.component').then(m => m.UsuariosListaComponent)
  }
];
