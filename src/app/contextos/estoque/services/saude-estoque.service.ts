import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../core/models/paginacao.model';
import {
  CategoriaSaudeEstoque,
  CorteGiroCritico,
  ProdutoSaudeEstoque,
  ResultadoInativacaoLote,
  SaudeEstoqueResumo
} from '../models/saude-estoque.model';

@Injectable({ providedIn: 'root' })
export class SaudeEstoqueService {
  private endpoint = '/v1/produtos';

  constructor(private api: ApiService) {}

  obterResumo(corteGiroCritico: CorteGiroCritico): Observable<Resultado<SaudeEstoqueResumo>> {
    return this.api.get<SaudeEstoqueResumo>(`${this.endpoint}/saude-estoque/resumo`, { corteGiroCritico });
  }

  listar(
    categoria: CategoriaSaudeEstoque,
    paginacao: ParametrosPaginacao,
    corteGiroCritico?: CorteGiroCritico
  ): Observable<Resultado<Paginacao<ProdutoSaudeEstoque>>> {
    const filtros = categoria === 'criticos' ? { corteGiroCritico } : undefined;
    return this.api.getPaginado<ProdutoSaudeEstoque>(`${this.endpoint}/saude-estoque/${categoria}`, paginacao, filtros);
  }

  inativar(idProduto: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${idProduto}/inativar`, {});
  }

  inativarLote(ids: number[]): Observable<Resultado<ResultadoInativacaoLote>> {
    return this.api.post<ResultadoInativacaoLote>(`${this.endpoint}/inativar-lote`, ids);
  }
}
