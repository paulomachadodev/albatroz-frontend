import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { CarregamentoPaginaService } from './carregamento-pagina.service';

export const SEM_CARREGAMENTO_DE_PAGINA = new HttpContextToken<boolean>(() => false);

export const carregamentoPaginaInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SEM_CARREGAMENTO_DE_PAGINA)) return next(req);
  const carregamento = inject(CarregamentoPaginaService);
  const contada = carregamento.requisicaoIniciada();
  return next(req).pipe(finalize(() => carregamento.requisicaoTerminada(contada)));
};
