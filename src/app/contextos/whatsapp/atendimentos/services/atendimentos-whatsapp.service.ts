import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../../core/models';
import { ParametrosPaginacao } from '../../../../core/models/paginacao.model';
import {
  AtendimentoWhatsappResumo,
  AtendimentoWhatsappMensal,
  AtendimentoWhatsappDiario,
  AtendimentoWhatsappMensagem,
  AtendimentoWhatsappStatus
} from '../models/atendimento-whatsapp.model';

export interface AtendimentoWhatsappFiltro {
  ano?: number;
  mes?: number;
  de?: string;
  ate?: string;
  tipo?: 'lista_escolar' | 'com_handoff';
  status?: AtendimentoWhatsappStatus;
}

@Injectable({ providedIn: 'root' })
export class AtendimentosWhatsappService {
  private endpoint = '/v1/atendimento/whatsapp';

  constructor(private api: ApiService) {}

  listar(paginacao: ParametrosPaginacao, filtros?: AtendimentoWhatsappFiltro): Observable<Resultado<Paginacao<AtendimentoWhatsappResumo>>> {
    return this.api.getPaginado<AtendimentoWhatsappResumo>(this.endpoint, paginacao, filtros);
  }

  porMes(ano: number): Observable<Resultado<AtendimentoWhatsappMensal[]>> {
    return this.api.get<AtendimentoWhatsappMensal[]>(`${this.endpoint}/por-mes`, { ano });
  }

  porDia(ano: number, mes: number): Observable<Resultado<AtendimentoWhatsappDiario[]>> {
    return this.api.get<AtendimentoWhatsappDiario[]>(`${this.endpoint}/por-dia`, { ano, mes });
  }

  mensagens(whatsappId: string): Observable<Resultado<AtendimentoWhatsappMensagem[]>> {
    return this.api.get<AtendimentoWhatsappMensagem[]>(`${this.endpoint}/${whatsappId}/mensagens`);
  }

  vincular(whatsappId: string, idContato: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${whatsappId}/vincular`, { idContato });
  }

  processarVinculoAutomatico(): Observable<Resultado<{ vinculados: number }>> {
    return this.api.post<{ vinculados: number }>(`${this.endpoint}/processar-vinculo-automatico`, {});
  }
}
