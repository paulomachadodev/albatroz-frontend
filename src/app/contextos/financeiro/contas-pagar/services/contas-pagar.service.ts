import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../../core/models/paginacao.model';
import { ContaPagar, CriarContaPagarRequisicao, DarBaixaContaPagarRequisicao, FiltroVencimento } from '../models/conta-pagar.model';

@Injectable({ providedIn: 'root' })
export class ContasPagarService {
  private endpoint = '/v1/financeiro/contas-pagar';

  constructor(private api: ApiService) {}

  listar(
    filtro: FiltroVencimento,
    paginacao: ParametrosPaginacao,
    situacao?: number,
    busca?: string
  ): Observable<Resultado<Paginacao<ContaPagar>>> {
    return this.api.getPaginado<ContaPagar>(this.endpoint, paginacao, {
      filtro,
      ...(situacao != null && { situacao }),
      ...(busca && { busca })
    });
  }

  darBaixa(id: number, body: DarBaixaContaPagarRequisicao): Observable<Resultado<any>> {
    return this.api.post<any>(`${this.endpoint}/${id}/baixa`, body);
  }

  criar(body: CriarContaPagarRequisicao): Observable<Resultado<number>> {
    return this.api.post<number>(this.endpoint, body);
  }
}
