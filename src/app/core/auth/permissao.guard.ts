import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const permissaoGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const permissao = route.data['permissao'] as string | undefined;
  if (!permissao || auth.temPermissao(permissao)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
