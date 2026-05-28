import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { environment } from '../../../../../environments/environment';
import { Fatura } from '../models/fatura.model';
import { DespesaCartao } from '../models/despesa-cartao.model';
import { DespesaCartaoSalvarRequisicao, ExtrairFaturaResposta } from '../dtos/despesa-cartao-salvar.dto';

@Injectable({ providedIn: 'root' })
export class FaturasService {
  private readonly base = '/v1/financeiro/faturas';

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  listarPorCartao(cartaoId: number): Observable<Resultado<Fatura[]>> {
    return this.api.get<Fatura[]>(this.base, { cartaoId });
  }

  obterDespesas(faturaId: number): Observable<Resultado<DespesaCartao[]>> {
    return this.api.get<DespesaCartao[]>(`${this.base}/${faturaId}/despesas`);
  }

  atualizarStatus(faturaId: number, status: number): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.base}/${faturaId}/status`, { status });
  }

  extrairPdf(cartaoId: number, arquivo: File): Observable<Resultado<ExtrairFaturaResposta>> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    form.append('cartaoId', String(cartaoId));
    return this.http.post<Resultado<ExtrairFaturaResposta>>(
      `${environment.apiUrl}${this.base}/extrair`,
      form
    );
  }

  salvarDespesas(faturaId: number, req: DespesaCartaoSalvarRequisicao): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.base}/${faturaId}/despesas`, req);
  }
}
