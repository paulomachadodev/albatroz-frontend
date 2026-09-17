import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../core/models/paginacao.model';
import {
  BiparItemContagemSessaoRequisicao,
  ContagemSessaoDetalhe,
  ContagemSessaoItem,
  ContagemSessaoResumo,
  DesfazerContagemSessaoResposta,
  EfetivarContagemSessaoResposta,
  FinalizarContagemSessaoResposta,
  IniciarContagemSessaoRequisicao,
  PendentesSessao,
  StatusContagemSessao
} from '../models/contagem-estoque.model';

@Injectable({ providedIn: 'root' })
export class ContagemSessaoService {
  private endpoint = '/v1/produtos/contagem/sessoes';

  constructor(private api: ApiService) {}

  iniciar(requisicao: IniciarContagemSessaoRequisicao): Observable<Resultado<ContagemSessaoResumo>> {
    return this.api.post<ContagemSessaoResumo>(this.endpoint, requisicao);
  }

  listar(
    paginacao: ParametrosPaginacao,
    status?: StatusContagemSessao[],
    todas = false
  ): Observable<Resultado<Paginacao<ContagemSessaoResumo>>> {
    return this.api.getPaginado<ContagemSessaoResumo>(this.endpoint, paginacao, { status, todas });
  }

  obterDetalhe(idSessao: number): Observable<Resultado<ContagemSessaoDetalhe>> {
    return this.api.get<ContagemSessaoDetalhe>(`${this.endpoint}/${idSessao}`);
  }

  listarPendentes(idSessao: number): Observable<Resultado<PendentesSessao>> {
    return this.api.get<PendentesSessao>(`${this.endpoint}/${idSessao}/pendentes`);
  }

  bipar(idSessao: number, requisicao: BiparItemContagemSessaoRequisicao): Observable<Resultado<ContagemSessaoItem>> {
    return this.api.post<ContagemSessaoItem>(`${this.endpoint}/${idSessao}/itens`, requisicao);
  }

  finalizar(idSessao: number): Observable<Resultado<FinalizarContagemSessaoResposta>> {
    return this.api.post<FinalizarContagemSessaoResposta>(`${this.endpoint}/${idSessao}/finalizar`, {});
  }

  efetivar(idSessao: number): Observable<Resultado<EfetivarContagemSessaoResposta>> {
    return this.api.post<EfetivarContagemSessaoResposta>(`${this.endpoint}/${idSessao}/efetivar`, {});
  }

  desfazer(idSessao: number): Observable<Resultado<DesfazerContagemSessaoResposta>> {
    return this.api.post<DesfazerContagemSessaoResposta>(`${this.endpoint}/${idSessao}/desfazer`, {});
  }

  cancelar(idSessao: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${idSessao}/cancelar`, {});
  }

  excluir(idSessao: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${idSessao}`);
  }
}
