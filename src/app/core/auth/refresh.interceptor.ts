import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      const isUnauthorized = err.status === HttpStatusCode.Unauthorized;
      const isForbidden = err.status === HttpStatusCode.Forbidden;
      const isAuthUrl = req.url.includes('/autenticacao/');

      if (isAuthUrl) {
        return throwError(() => err);
      }

      if (isForbidden && err.error?.erro?.includes('empresa_id')) {
        console.warn('[RefreshInterceptor] 403 Forbidden — empresa_id missing', {
          url: req.url,
          error: err.error?.erro
        });
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      if (!isUnauthorized) {
        if (isForbidden || err.status === HttpStatusCode.BadRequest) {
          console.warn('[RefreshInterceptor] Non-401 auth error', {
            status: err.status,
            url: req.url,
            error: err.error
          });
        }
        return throwError(() => err);
      }

      return auth.renovar().pipe(
        switchMap(resp => {
          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${resp.accessToken}` }
          }));
        }),
        catchError(refreshErr => {
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
