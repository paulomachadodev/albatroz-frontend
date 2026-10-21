import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Paginacao } from '../../../core/models/paginacao.model';
import { environment } from '../../../../environments/environment';
import {
  NotaEntradaResumo,
  NotaEntradaDetalhe,
  SugestaoDescricaoProduto,
  ProdutoCriadoViaNfe
} from '../models/nota-entrada.model';

@Injectable({ providedIn: 'root' })
export class NotasEntradaService {
  private base = '/v1/compras/notas-entrada';

  constructor(private api: ApiService, private http: HttpClient) {}

  importarXml(arquivo: File): Observable<Resultado<NotaEntradaResumo>> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http.post<Resultado<NotaEntradaResumo>>(
      `${environment.apiUrl}${this.base}`, form
    );
  }

  listar(pagina: number, tamanho: number, status?: number, busca?: string): Observable<Resultado<Paginacao<NotaEntradaResumo> & { dados: NotaEntradaResumo[] }>> {
    return this.api.get<any>(this.base, { pagina, tamanho, status, busca });
  }

  obter(id: number): Observable<Resultado<NotaEntradaDetalhe>> {
    return this.api.get<NotaEntradaDetalhe>(`${this.base}/${id}`);
  }

  matchar(id: number): Observable<Resultado<any>> {
    return this.api.post<any>(`${this.base}/${id}/match`, {});
  }

  calcularCusto(id: number): Observable<Resultado<any>> {
    return this.api.post<any>(`${this.base}/${id}/calcular-custo`, {});
  }

  confirmar(id: number): Observable<Resultado<any>> {
    return this.api.post<any>(`${this.base}/${id}/confirmar`, {});
  }

  obterSugestaoDescricao(notaId: number, itemId: number): Observable<Resultado<SugestaoDescricaoProduto>> {
    return this.api.get<SugestaoDescricaoProduto>(`${this.base}/${notaId}/itens/${itemId}/sugestao-produto`);
  }

  criarProduto(notaId: number, itemId: number, descricao: string): Observable<Resultado<ProdutoCriadoViaNfe>> {
    return this.api.post<ProdutoCriadoViaNfe>(`${this.base}/${notaId}/itens/${itemId}/criar-produto`, { descricao });
  }
}
