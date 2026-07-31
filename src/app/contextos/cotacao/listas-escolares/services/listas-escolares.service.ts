import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../../core/models';
import { ParametrosPaginacao } from '../../../../core/models/paginacao.model';
import { ListaEscolarResumo, ListaEscolarDetalhe, ProdutoBusca } from '../models/lista-escolar.model';
import { ListaEscolarAtualizarRequisicao, ListaEscolarItemAtualizarRequisicao, ListaEscolarItemAdicionarRequisicao } from '../dtos/lista-escolar-item-atualizar.dto';
import { OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';

export interface ListaEscolarFiltro {
  idEscola?: number;
  idSerie?: number;
  status?: string;
  de?: string;
  ate?: string;
}

@Injectable({ providedIn: 'root' })
export class ListasEscolaresService {
  private endpoint = '/v1/cotacao/listas-escolares';

  constructor(private api: ApiService) {}

  listar(paginacao: ParametrosPaginacao, filtros?: ListaEscolarFiltro): Observable<Resultado<Paginacao<ListaEscolarResumo>>> {
    return this.api.getPaginado<ListaEscolarResumo>(this.endpoint, paginacao, filtros);
  }

  obter(id: number): Observable<Resultado<ListaEscolarDetalhe>> {
    return this.api.get<ListaEscolarDetalhe>(`${this.endpoint}/${id}`);
  }

  atualizarLista(id: number, requisicao: ListaEscolarAtualizarRequisicao): Observable<Resultado<void>> {
    return this.api.patch<void>(`${this.endpoint}/${id}`, requisicao);
  }

  atualizarItem(idLista: number, idItem: number, requisicao: ListaEscolarItemAtualizarRequisicao): Observable<Resultado<void>> {
    return this.api.patch<void>(`${this.endpoint}/${idLista}/itens/${idItem}`, requisicao);
  }

  liberarItem(idLista: number, idItem: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${idLista}/itens/${idItem}/liberar`, {});
  }

  desliberarItem(idLista: number, idItem: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${idLista}/itens/${idItem}/desliberar`, {});
  }

  excluirItem(idLista: number, idItem: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${idLista}/itens/${idItem}`);
  }

  adicionarItem(idLista: number, requisicao: ListaEscolarItemAdicionarRequisicao): Observable<Resultado<{ id: number }>> {
    return this.api.post<{ id: number }>(`${this.endpoint}/${idLista}/itens`, requisicao);
  }

  liberarLista(idLista: number): Observable<Resultado<{ whatsappIdsParaNotificar: string[] }>> {
    return this.api.post<{ whatsappIdsParaNotificar: string[] }>(`${this.endpoint}/${idLista}/liberar`, {});
  }

  reabrirEdicao(idLista: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${idLista}/reabrir`, {});
  }

  buscarProdutos(termo: string): Observable<Resultado<ProdutoBusca[]>> {
    return this.api.get<ProdutoBusca[]>(`${this.endpoint}/produtos/busca`, { termo });
  }

  buscarEscolasComCotacao(termo: string): Observable<Resultado<OpcaoSelectBusca[]>> {
    return this.api.get<OpcaoSelectBusca[]>(`${this.endpoint}/filtros/escolas`, { termo });
  }

  buscarSeriesComCotacao(termo: string): Observable<Resultado<OpcaoSelectBusca[]>> {
    return this.api.get<OpcaoSelectBusca[]>(`${this.endpoint}/filtros/series`, { termo });
  }

  enviarArquivo(arquivo: File): Observable<Resultado<{ idLista: number | null; status: string }>> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return this.api.post<{ idLista: number | null; status: string }>(`${this.endpoint}/enviar-arquivo`, formData);
  }
}
