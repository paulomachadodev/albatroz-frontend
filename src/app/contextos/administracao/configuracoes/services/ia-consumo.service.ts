import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models/resultado.model';
import { IaConsumo, IaConsumoFiltro } from '../models/ia-consumo.model';

@Injectable({ providedIn: 'root' })
export class IaConsumoService {
  private readonly api = inject(ApiService);

  listar(filtro: IaConsumoFiltro): Observable<Resultado<IaConsumo>> {
    return this.api.get('/v1/ia/consumo', { ...filtro });
  }
}
