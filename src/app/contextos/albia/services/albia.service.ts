import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { CotarListaRequisicao, BuscarSemanticaRequisicao } from '../dtos/cotacao-requisicao.dto';
import { CotacaoListaResposta, ResultadoBuscaSemanticaResposta } from '../dtos/cotacao-resposta.dto';

@Injectable({
  providedIn: 'root'
})
export class AlbiaService {
  private endpoint = '/interno/v1/albia';

  constructor(private api: ApiService) {}

  cotarLista(requisicao: CotarListaRequisicao): Observable<Resultado<CotacaoListaResposta>> {
    return this.api.post<CotacaoListaResposta>(`${this.endpoint}/cotar-lista`, requisicao);
  }

  buscarSemantica(requisicao: BuscarSemanticaRequisicao): Observable<Resultado<ResultadoBuscaSemanticaResposta>> {
    return this.api.post<ResultadoBuscaSemanticaResposta>(`${this.endpoint}/buscar-semantica`, requisicao);
  }

  buscarTexto(texto: string): Observable<Resultado<any>> {
    return this.api.get(`${this.endpoint}/buscar-texto`, { texto });
  }
}
