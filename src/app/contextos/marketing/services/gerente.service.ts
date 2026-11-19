import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { PlanoSemanal } from '../models/gerente.model';

@Injectable({ providedIn: 'root' })
export class GerenteService {
  private readonly api = inject(ApiService);

  planoSemanal(): Observable<Resultado<PlanoSemanal>> {
    return this.api.get('/v1/marketing/gerente/plano-semanal');
  }
}
