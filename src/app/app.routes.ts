import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { PRODUTOS_ROUTES } from './contextos/produtos/produtos.routes';
import { ALBIA_ROUTES } from './contextos/albia/albia.routes';

export const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: '/dashboard',
  //   pathMatch: 'full'
  // },
  // {
  //   path: 'login',
  //   component: LoginComponent
  // },
  {
    path: 'produtos',
    canActivate: [authGuard],
    children: PRODUTOS_ROUTES
  },
  {
    path: 'albia',
    canActivate: [authGuard],
    children: ALBIA_ROUTES
  }
  // Adicionar mais rotas conforme necessário
];
