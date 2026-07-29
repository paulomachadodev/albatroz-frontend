import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// TEMP 2026-07-28 — redirect automático pro /login desligado enquanto a auth do
// backend está bypassada (ver ServiceExtensions.cs). Sem isso, um token velho/expirado
// sobrando no localStorage do navegador força logout+redirect mesmo com o backend
// aceitando anônimo. Reverter junto com o resto do débito técnico de auth.
const REDIRECT_NO_LOGIN_DESLIGADO = true;

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
        if (!REDIRECT_NO_LOGIN_DESLIGADO) {
          auth.logout();
          router.navigate(['/login']);
        }
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

      if (REDIRECT_NO_LOGIN_DESLIGADO) {
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
