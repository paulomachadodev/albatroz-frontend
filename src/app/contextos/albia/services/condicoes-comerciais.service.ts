import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { CondicoesComerciais } from '../models/condicoes-comerciais.model';
import { CondicoesComerciaisAtualizarRequisicao } from '../dtos/condicoes-comerciais.dto';

@Injectable({ providedIn: 'root' })
export class CondicoesComerciaisService {
  private endpoint = '/v1/cotacao/condicoes-comerciais';

  constructor(private api: ApiService) {}

  obter(): Observable<Resultado<CondicoesComerciais | null>> {
    return this.api.get<CondicoesComerciais | null>(this.endpoint);
  }

  atualizar(requisicao: CondicoesComerciaisAtualizarRequisicao): Observable<Resultado<CondicoesComerciais>> {
    return this.api.put<CondicoesComerciais>(this.endpoint, requisicao);
  }
}
