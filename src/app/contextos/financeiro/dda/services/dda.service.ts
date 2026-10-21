import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { DetalheImportacaoDda, ImportacaoDda } from '../models/dda.model';

@Injectable({ providedIn: 'root' })
export class DdaService {
  private endpoint = '/v1/financeiro/dda';

  constructor(private api: ApiService) {}

  importar(arquivo: File): Observable<Resultado<ImportacaoDda>> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.api.post<ImportacaoDda>(`${this.endpoint}/importar`, form);
  }

  listar(): Observable<Resultado<ImportacaoDda[]>> {
    return this.api.get<ImportacaoDda[]>(this.endpoint);
  }

  obter(importacaoId: number): Observable<Resultado<DetalheImportacaoDda>> {
    return this.api.get<DetalheImportacaoDda>(`${this.endpoint}/${importacaoId}`);
  }

  autoConciliar(importacaoId: number): Observable<Resultado<{ matchados: number }>> {
    return this.api.post<{ matchados: number }>(`${this.endpoint}/${importacaoId}/conciliar`, {});
  }

  vincularManual(importacaoId: number, lancamentoId: number, contaPagarId: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${importacaoId}/vincular`, { lancamentoId, contaPagarId });
  }

  desvincular(lancamentoId: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/lancamentos/${lancamentoId}/vincular`);
  }

  baixar(importacaoId: number, lancamentoIds: number[]): Observable<Resultado<{ baixados: number }>> {
    return this.api.post<{ baixados: number }>(`${this.endpoint}/${importacaoId}/baixar`, { lancamentoIds });
  }
}
