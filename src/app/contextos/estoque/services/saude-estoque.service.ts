import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { CorteGiroCritico, SaudeEstoque } from '../models/saude-estoque.model';

@Injectable({ providedIn: 'root' })
export class SaudeEstoqueService {
  private endpoint = '/v1/produtos';

  constructor(private api: ApiService) {}

  obterSaudeEstoque(corteGiroCritico: CorteGiroCritico): Observable<Resultado<SaudeEstoque>> {
    return this.api.get<SaudeEstoque>(`${this.endpoint}/saude-estoque`, { corteGiroCritico });
  }

  inativar(idProduto: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${idProduto}/inativar`, {});
  }
}
