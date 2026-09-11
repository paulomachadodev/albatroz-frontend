import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../../core/models/paginacao.model';
import { ContaPagar, FiltroContasPagar } from '../models/conta-pagar.model';

@Injectable({ providedIn: 'root' })
export class ContasPagarService {
  private endpoint = '/v1/financeiro/contas-pagar';

  constructor(private api: ApiService) {}

  listar(filtro: FiltroContasPagar, paginacao: ParametrosPaginacao): Observable<Resultado<Paginacao<ContaPagar>>> {
    return this.api.getPaginado<ContaPagar>(this.endpoint, paginacao, { filtro });
  }
}
