import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

// TEMP 2026-07-28 — nunca anexa token enquanto a auth do backend está bypassada
// (ver ServiceExtensions.cs). Token velho/expirado no localStorage do navegador
// seria rejeitado pelo backend (401 na validação do JWT, antes da policy permissiva),
// disparando o refreshInterceptor sem necessidade. Reverter junto com o resto do
// débito técnico de auth.
const NAO_ANEXAR_TOKEN = true;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = NAO_ANEXAR_TOKEN ? null : inject(AuthService).getToken();

  if (!token) return next(req);

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    }
  }));
};
