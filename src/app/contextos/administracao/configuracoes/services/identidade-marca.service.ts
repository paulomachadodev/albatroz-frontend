import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models/resultado.model';
import { IdentidadeMarca, IdentidadeMarcaRequisicao } from '../models/identidade-marca.model';

@Injectable({ providedIn: 'root' })
export class IdentidadeMarcaService {
  private readonly api = inject(ApiService);

  obter(): Observable<Resultado<IdentidadeMarca>> {
    return this.api.get('/v1/configuracoes/identidade-marca');
  }

  salvar(requisicao: IdentidadeMarcaRequisicao): Observable<Resultado<IdentidadeMarca>> {
    return this.api.put('/v1/configuracoes/identidade-marca', requisicao);
  }
}
