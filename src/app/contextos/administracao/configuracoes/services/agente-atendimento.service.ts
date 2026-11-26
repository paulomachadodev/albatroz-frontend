import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { AgenteConfig, AgenteConfigRequisicao, ContatoBloqueado, ContatoBloqueadoRequisicao } from '../models/agente-atendimento.model';

import { SecoesAgente } from '../models/agente-secoes.model';

@Injectable({ providedIn: 'root' })
export class AgenteAtendimentoService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/agente-atendimento';

  obterConfiguracao(): Observable<Resultado<AgenteConfig>> {
    return this.api.get(`${this.base}/configuracao`);
  }

  salvarConfiguracao(requisicao: AgenteConfigRequisicao): Observable<Resultado<AgenteConfig>> {
    return this.api.put(`${this.base}/configuracao`, requisicao);
  }

  listarBloqueados(): Observable<Resultado<ContatoBloqueado[]>> {
    return this.api.get(`${this.base}/contatos-bloqueados`);
  }

  adicionarBloqueado(requisicao: ContatoBloqueadoRequisicao): Observable<Resultado<ContatoBloqueado>> {
    return this.api.post(`${this.base}/contatos-bloqueados`, requisicao);
  }

  alterarBloqueado(id: number, requisicao: ContatoBloqueadoRequisicao): Observable<Resultado<ContatoBloqueado>> {
    return this.api.put(`${this.base}/contatos-bloqueados/${id}`, requisicao);
  }

  obterSecoes(): Observable<Resultado<SecoesAgente>> {
    return this.api.get(`${this.base}/secoes`);
  }

  salvarSecao(secao: number, requisicao: { conteudo: object; versaoEsperada: string }): Observable<Resultado<SecoesAgente>> {
    return this.api.put(`${this.base}/secoes/${secao}`, requisicao);
  }

  removerBloqueado(id: number): Observable<Resultado<void>> {
    return this.api.delete(`${this.base}/contatos-bloqueados/${id}`);
  }
}
