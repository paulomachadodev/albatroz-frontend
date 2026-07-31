import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../../core/models';
import { Escola, Serie } from '../models/escola.model';
import { EscolaCriarRequisicao, EscolaAtualizarRequisicao, SerieCriarRequisicao, SerieAtualizarRequisicao } from '../dtos/escola.dto';
import { OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';

@Injectable({ providedIn: 'root' })
export class EscolasService {
  private endpoint = '/v1/cadastros/escolas';

  constructor(private api: ApiService) {}

  listar(pagina: number, tamanho: number, nome?: string): Observable<Resultado<Paginacao<Escola>>> {
    return this.api.getPaginado<Escola>(this.endpoint, { pagina, tamanho }, nome ? { nome } : undefined);
  }

  criar(requisicao: EscolaCriarRequisicao): Observable<Resultado<Escola>> {
    return this.api.post<Escola>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: EscolaAtualizarRequisicao): Observable<Resultado<Escola>> {
    return this.api.patch<Escola>(`${this.endpoint}/${id}`, requisicao);
  }

  excluir(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  buscar(termo: string): Observable<Resultado<OpcaoSelectBusca[]>> {
    return this.api.getPaginado<Escola>(this.endpoint, { pagina: 1, tamanho: 20 }, termo ? { nome: termo } : undefined).pipe(
      map(res => ({ ...res, dados: (res.dados?.dados ?? []).map(e => ({ id: e.id, nome: e.nome })) }))
    );
  }

  buscarSeries(escolaId: number, termo: string): Observable<Resultado<OpcaoSelectBusca[]>> {
    return this.api.get<OpcaoSelectBusca[]>(`${this.endpoint}/${escolaId}/series`, { termo });
  }

  listarTodasSeries(escolaId: number): Observable<Resultado<Serie[]>> {
    return this.api.get<Serie[]>(`${this.endpoint}/${escolaId}/series/todas`);
  }

  criarSerie(escolaId: number, requisicao: SerieCriarRequisicao): Observable<Resultado<Serie>> {
    return this.api.post<Serie>(`${this.endpoint}/${escolaId}/series`, requisicao);
  }

  atualizarSerie(escolaId: number, serieId: number, requisicao: SerieAtualizarRequisicao): Observable<Resultado<Serie>> {
    return this.api.patch<Serie>(`${this.endpoint}/${escolaId}/series/${serieId}`, requisicao);
  }
}
