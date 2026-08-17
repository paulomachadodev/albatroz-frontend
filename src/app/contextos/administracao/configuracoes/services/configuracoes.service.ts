import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Configuracao } from '../models/configuracao.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracoesService {
  private endpoint = '/v1/configuracoes';

  constructor(private api: ApiService) {}

  listar(): Observable<Resultado<Configuracao[]>> {
    return this.api.get<Configuracao[]>(this.endpoint);
  }

  atualizar(chave: string, valor: string | null): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${chave}`, { valor });
  }
}
