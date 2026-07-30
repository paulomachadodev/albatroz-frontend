import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../../core/models';
import { Escola } from '../models/escola.model';
import { EscolaCriarRequisicao, EscolaAtualizarRequisicao } from '../dtos/escola.dto';

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
}
