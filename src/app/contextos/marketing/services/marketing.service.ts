import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Paginacao, Resultado } from '../../../core/models';
import {
  Briefing, BriefingAtualizacao, BriefingEdicao, BriefingFiltro,
  EstrategiaEditorial, EstrategiaEditorialRequisicao
} from '../models/marketing.model';

@Injectable({ providedIn: 'root' })
export class MarketingService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/v1/marketing';

  obterEstrategia(): Observable<Resultado<EstrategiaEditorial>> {
    return this.api.get(`${this.endpoint}/estrategia-editorial`);
  }

  salvarEstrategia(requisicao: EstrategiaEditorialRequisicao): Observable<Resultado<EstrategiaEditorial>> {
    return this.api.put(`${this.endpoint}/estrategia-editorial`, requisicao);
  }

  listarBriefings(pagina: number, tamanho: number, filtro?: BriefingFiltro): Observable<Resultado<Paginacao<Briefing>>> {
    return this.api.getPaginado<Briefing>(`${this.endpoint}/briefings`, { pagina, tamanho }, filtro);
  }

  criarBriefing(requisicao: BriefingEdicao): Observable<Resultado<Briefing>> {
    return this.api.post(`${this.endpoint}/briefings`, requisicao);
  }

  atualizarBriefing(id: number, requisicao: BriefingAtualizacao): Observable<Resultado<Briefing>> {
    return this.api.put(`${this.endpoint}/briefings/${id}`, requisicao);
  }
}
