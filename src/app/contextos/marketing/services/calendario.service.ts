import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Calendario } from '../models/calendario.model';

@Injectable({ providedIn: 'root' })
export class CalendarioService {
  private readonly api = inject(ApiService);

  obter(inicio: string, fim: string): Observable<Resultado<Calendario>> {
    return this.api.get('/v1/marketing/calendario', { inicio, fim });
  }
}
