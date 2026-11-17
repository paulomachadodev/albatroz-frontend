import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models/resultado.model';
import { IaConsumo, IaConsumoFiltro } from '../models/ia-consumo.model';

@Injectable({ providedIn: 'root' })
export class IaConsumoService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  listar(filtro: IaConsumoFiltro): Observable<Resultado<IaConsumo>> {
    return this.api.get('/v1/ia/consumo', { ...filtro });
  }
  exportar(filtro: IaConsumoFiltro): Observable<Blob> {
    let params = new HttpParams();
    for (const [nome, valor] of Object.entries(filtro)) {
      if (valor != null) params = params.set(nome, valor);
    }
    return this.http.get(environment.apiUrl + '/v1/ia/consumo/exportacao', { params, responseType: 'blob' });
  }
}
