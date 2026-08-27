import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../core/models';
import { ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { PedidoCompraResumo, PedidoCompraDetalhe, CriarPedidoCompraRequisicao } from '../models/pedido-compra.model';

export interface PedidoCompraFiltro {
  situacao?: number;
  idFornecedor?: number;
}

@Injectable({ providedIn: 'root' })
export class PedidosCompraService {
  private endpoint = '/v1/pedidos-compra';

  constructor(private api: ApiService) {}

  listar(paginacao: ParametrosPaginacao, filtros?: PedidoCompraFiltro): Observable<Resultado<Paginacao<PedidoCompraResumo>>> {
    return this.api.getPaginado<PedidoCompraResumo>(this.endpoint, paginacao, filtros);
  }

  obter(id: number): Observable<Resultado<PedidoCompraDetalhe>> {
    return this.api.get<PedidoCompraDetalhe>(`${this.endpoint}/${id}`);
  }

  criar(requisicao: CriarPedidoCompraRequisicao): Observable<Resultado<number>> {
    return this.api.post<number>(this.endpoint, requisicao);
  }

  atualizarStatus(id: number, situacao: number): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/status`, { situacao });
  }

  excluir(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
