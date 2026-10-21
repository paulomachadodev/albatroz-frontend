import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { environment } from '../../../../environments/environment';
import { CteResumo, CteDetalhe, PreviewRateioCte } from '../models/cte.model';

@Injectable({ providedIn: 'root' })
export class CtesService {
  private base = '/v1/compras/ctes';

  constructor(private api: ApiService, private http: HttpClient) {}

  importarXml(arquivo: File): Observable<Resultado<CteDetalhe>> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http.post<Resultado<CteDetalhe>>(
      `${environment.apiUrl}${this.base}/importar-xml`, form
    );
  }

  criarManual(body: {
    idContatoTransportadora?: number;
    numeroCte?: string;
    serie?: string;
    dataEmissao?: string;
    modalidade?: string;
    valorFrete: number;
    valorIcms?: number;
    metodoRateio?: string;
  }): Observable<Resultado<CteDetalhe>> {
    return this.api.post<CteDetalhe>(this.base, body);
  }

  listar(pagina: number, tamanho: number, status?: number): Observable<Resultado<any>> {
    return this.api.get<any>(this.base, { pagina, tamanho, status });
  }

  obter(id: number): Observable<Resultado<CteDetalhe>> {
    return this.api.get<CteDetalhe>(`${this.base}/${id}`);
  }

  previewRateio(id: number): Observable<Resultado<PreviewRateioCte>> {
    return this.api.get<PreviewRateioCte>(`${this.base}/${id}/preview-rateio`);
  }

  vincularNota(cteId: number, notaId: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.base}/${cteId}/vincular-nota/${notaId}`, {});
  }

  desvincularNota(cteId: number, notaId: number): Observable<Resultado<void>> {
    return this.http.delete<Resultado<void>>(
      `${environment.apiUrl}${this.base}/${cteId}/vincular-nota/${notaId}`
    );
  }

  confirmar(id: number): Observable<Resultado<any>> {
    return this.api.post<any>(`${this.base}/${id}/confirmar`, {});
  }
}
