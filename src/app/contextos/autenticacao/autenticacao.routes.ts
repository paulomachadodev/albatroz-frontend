import { Routes } from '@angular/router';
import { publicoGuard } from '../../core/auth/auth.guard';

export const AUTENTICACAO_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [publicoGuard],
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'esqueci-senha',
    canActivate: [publicoGuard],
    loadComponent: () =>
      import('./esqueci-senha/esqueci-senha.component').then(m => m.EsqueciSenhaComponent)
  },
  {
    path: 'redefinir-senha',
    canActivate: [publicoGuard],
    loadComponent: () =>
      import('./redefinir-senha/redefinir-senha.component').then(m => m.RedefinirSenhaComponent)
  }
];
