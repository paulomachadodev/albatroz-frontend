import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { AgendamentosLista, AgendarRequisicao } from '../models/agendamento.model';

@Injectable({ providedIn: 'root' })
export class AgendamentosService {
  private readonly api = inject(ApiService);

  listar(pecaId: number): Observable<Resultado<AgendamentosLista>> { return this.api.get(this.base(pecaId)); }
  agendar(pecaId: number, requisicao: AgendarRequisicao): Observable<Resultado<AgendamentosLista>> { return this.api.post(this.base(pecaId), requisicao); }
  cancelar(pecaId: number, id: number, versaoEsperada: string): Observable<Resultado<AgendamentosLista>> { return this.api.post(`${this.base(pecaId)}/${id}/cancelamento`, { versaoEsperada }); }

  private base(pecaId: number): string { return `/v1/marketing/pecas/${pecaId}/agendamentos`; }
}
