import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Aprovacoes, Rotina, RotinaRequisicao, RotinasLista } from '../models/rotina.model';

@Injectable({ providedIn: 'root' })
export class RotinasService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/marketing';

  listar(): Observable<Resultado<RotinasLista>> { return this.api.get(`${this.base}/rotinas`); }
  criar(requisicao: RotinaRequisicao): Observable<Resultado<Rotina>> { return this.api.post(`${this.base}/rotinas`, requisicao); }
  atualizar(id: number, requisicao: RotinaRequisicao): Observable<Resultado<Rotina>> { return this.api.put(`${this.base}/rotinas/${id}`, requisicao); }
  remover(id: number): Observable<Resultado<void>> { return this.api.delete(`${this.base}/rotinas/${id}`); }
  aprovacoes(): Observable<Resultado<Aprovacoes>> { return this.api.get(`${this.base}/aprovacoes`); }
  aprovar(id: number, versaoEsperada: string): Observable<Resultado<unknown>> { return this.api.post(`${this.base}/aprovacoes/${id}/aprovacao`, { versaoEsperada }); }
  descartar(id: number, versaoEsperada: string): Observable<Resultado<void>> { return this.api.post(`${this.base}/aprovacoes/${id}/descarte`, { versaoEsperada }); }
}
