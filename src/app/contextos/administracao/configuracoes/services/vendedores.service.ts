import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Vendedor } from '../models/vendedor.model';

@Injectable({ providedIn: 'root' })
export class VendedoresService {
  private endpoint = '/v1/vendedores';

  constructor(private api: ApiService) {}

  listar(): Observable<Resultado<Vendedor[]>> {
    return this.api.get<Vendedor[]>(this.endpoint);
  }
}
