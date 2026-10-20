import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import {
  NaturezaOperacao,
  NaturezaOperacaoDados,
  NaturezaOperacaoResumo,
  TributacaoResolvida
} from '../models/natureza-operacao.model';

@Injectable({ providedIn: 'root' })
export class NaturezasOperacaoService {
  private endpoint = '/v1/fiscal/naturezas-operacao';

  constructor(private api: ApiService) {}

  listar(tipo?: number): Observable<Resultado<NaturezaOperacaoResumo[]>> {
    return this.api.get<NaturezaOperacaoResumo[]>(this.endpoint, tipo ? { tipo } : undefined);
  }

  obter(id: number): Observable<Resultado<NaturezaOperacao>> {
    return this.api.get<NaturezaOperacao>(`${this.endpoint}/${id}`);
  }

  criar(dados: NaturezaOperacaoDados): Observable<Resultado<NaturezaOperacao>> {
    return this.api.post<NaturezaOperacao>(this.endpoint, dados);
  }

  atualizar(id: number, dados: NaturezaOperacaoDados): Observable<Resultado<NaturezaOperacao>> {
    return this.api.put<NaturezaOperacao>(`${this.endpoint}/${id}`, dados);
  }

  excluir(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  simular(id: number, ufDestino: string, ncm: string | null): Observable<Resultado<TributacaoResolvida>> {
    return this.api.post<TributacaoResolvida>(`${this.endpoint}/${id}/simular`, { ufDestino, ncm });
  }
}
