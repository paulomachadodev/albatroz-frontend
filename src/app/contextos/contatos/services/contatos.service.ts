import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { ContatoBusca } from '../models/contato-busca.model';

@Injectable({ providedIn: 'root' })
export class ContatosService {
  private endpoint = '/v1/contatos';

  constructor(private api: ApiService) {}

  buscar(termo: string): Observable<Resultado<ContatoBusca[]>> {
    return this.api.get<ContatoBusca[]>(`${this.endpoint}/busca`, { termo });
  }
}
