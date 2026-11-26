import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { AgenteConfig, AgenteConfigRequisicao, ContatoBloqueado, ContatoBloqueadoRequisicao } from '../models/agente-atendimento.model';

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

  removerBloqueado(id: number): Observable<Resultado<void>> {
    return this.api.delete(`${this.base}/contatos-bloqueados/${id}`);
  }
}
