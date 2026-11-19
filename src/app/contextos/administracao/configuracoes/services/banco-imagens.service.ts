import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { BancoImagensConfiguracao, BancoImagensRequisicao } from '../models/banco-imagens.model';

@Injectable({ providedIn: 'root' })
export class BancoImagensService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/v1/marketing/banco-imagens';

  obter(): Observable<Resultado<BancoImagensConfiguracao>> {
    return this.api.get(this.endpoint);
  }

  salvar(requisicao: BancoImagensRequisicao): Observable<Resultado<BancoImagensConfiguracao>> {
    return this.api.put(this.endpoint, requisicao);
  }

  remover(): Observable<Resultado<void>> {
    return this.api.delete(this.endpoint);
  }
}
