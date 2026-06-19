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
      if (err.status !== HttpStatusCode.Unauthorized || req.url.includes('/autenticacao/')) {
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
