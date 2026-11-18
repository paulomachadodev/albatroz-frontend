import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Briefing } from '../models/marketing.model';
import { GeracaoMarketing, GeracaoMarketingLista } from '../models/geracao-marketing.model';

@Injectable({ providedIn: 'root' })
export class GeracoesMarketingService {
  private readonly api = inject(ApiService);

  obterBriefing(id: number): Observable<Resultado<Briefing>> {
    return this.api.get('/v1/marketing/briefings/' + id);
  }

  listar(briefingId: number): Observable<Resultado<GeracaoMarketingLista>> {
    return this.api.get('/v1/marketing/briefings/' + briefingId + '/geracoes');
  }

  obter(id: string): Observable<Resultado<GeracaoMarketing>> {
    return this.api.get('/v1/marketing/geracoes/' + encodeURIComponent(id));
  }

  gerar(briefingId: number, chaveIdempotencia: string): Observable<Resultado<GeracaoMarketing>> {
    return this.api.post('/v1/marketing/briefings/' + briefingId + '/geracoes', { chaveIdempotencia });
  }

  cancelar(id: string): Observable<Resultado<GeracaoMarketing>> {
    return this.api.post('/v1/marketing/geracoes/' + encodeURIComponent(id) + '/cancelamento', {});
  }
}
