import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { InsightsInstagram } from '../models/insights.model';

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private readonly api = inject(ApiService);

  obterInstagram(dias: number): Observable<Resultado<InsightsInstagram>> {
    return this.api.get('/v1/marketing/insights/instagram', { dias });
  }
}
