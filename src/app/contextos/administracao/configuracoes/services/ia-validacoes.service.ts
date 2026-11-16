import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models/resultado.model';
import { IaValidacoes } from '../models/ia-validacoes.model';

@Injectable({ providedIn: 'root' })
export class IaValidacoesService {
  private readonly api = inject(ApiService);

  listar(inicio: string, fim: string, pagina: number, tamanhoPagina: number): Observable<Resultado<IaValidacoes>> {
    return this.api.get('/v1/configuracoes/ia/validacoes', { inicio, fim, pagina, tamanhoPagina });
  }
}
