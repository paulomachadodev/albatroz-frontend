import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { AssuntosEmAlta } from '../models/assunto-em-alta.model';

@Injectable({ providedIn: 'root' })
export class AssuntosEmAltaService {
  private readonly api = inject(ApiService);

  listar(): Observable<Resultado<AssuntosEmAlta>> {
    return this.api.get('/v1/marketing/assuntos-em-alta');
  }
}
