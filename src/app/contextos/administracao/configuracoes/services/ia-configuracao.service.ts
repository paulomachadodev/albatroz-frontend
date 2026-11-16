import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { IaConfiguracaoResultado } from '../models/ia-configuracao.model';

@Injectable({ providedIn: 'root' })
export class IaConfiguracaoService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/v1/configuracoes/ia';

  obter(): Observable<IaConfiguracaoResultado> {
    return this.api.get(this.endpoint);
  }

  salvar(chave: string, modelo: string): Observable<IaConfiguracaoResultado> {
    return this.api.put(this.endpoint, { chave, modelo });
  }

  remover(): Observable<IaConfiguracaoResultado> {
    return this.api.delete(this.endpoint);
  }
}
