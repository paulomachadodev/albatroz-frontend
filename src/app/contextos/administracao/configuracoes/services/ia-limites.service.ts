import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models/resultado.model';
import { IaLimites, IaLimiteConfiguracao } from '../models/ia-limites.model';

@Injectable({ providedIn: 'root' })
export class IaLimitesService {
  private readonly api = inject(ApiService);

  obter(): Observable<Resultado<IaLimites>> {
    return this.api.get('/v1/configuracoes/ia/limites');
  }

  salvar(configuracao: IaLimiteConfiguracao): Observable<Resultado<IaLimites>> {
    return this.api.put('/v1/configuracoes/ia/limites', configuracao);
  }

  conciliar(tentativaId: string, valorApuradoUsd: number, justificativa: string): Observable<Resultado<IaLimites>> {
    return this.api.post('/v1/configuracoes/ia/limites/reservas/' + encodeURIComponent(tentativaId) + '/conciliacao', { valorApuradoUsd, justificativa });
  }
}
