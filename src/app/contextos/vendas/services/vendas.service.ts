import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { VendaPagamento } from '../models/venda-pagamento.model';

@Injectable({ providedIn: 'root' })
export class VendasService {
  private endpoint = '/v1/vendas';

  constructor(private api: ApiService) {}

  listarPorFormaPagamento(forma: string | null, paginacao: ParametrosPaginacao): Observable<Resultado<Paginacao<VendaPagamento>>> {
    return this.api.getPaginado<VendaPagamento>(`${this.endpoint}/por-forma-pagamento`, paginacao, { forma });
  }
}
