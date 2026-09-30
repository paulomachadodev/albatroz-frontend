import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { IntegracaoTiny, SalvarIntegracaoTinyRequisicao } from '../models/integracao-tiny.model';

@Injectable({ providedIn: 'root' })
export class IntegracoesService {
  private api = inject(ApiService);
  private endpoint = '/v1/integracoes/tiny';

  obterTiny(): Observable<Resultado<IntegracaoTiny>> {
    return this.api.get<IntegracaoTiny>(this.endpoint);
  }

  salvarTiny(requisicao: SalvarIntegracaoTinyRequisicao): Observable<Resultado<IntegracaoTiny>> {
    return this.api.put<IntegracaoTiny>(this.endpoint, requisicao);
  }

  removerTiny(): Observable<Resultado<void>> {
    return this.api.delete<void>(this.endpoint);
  }
}
