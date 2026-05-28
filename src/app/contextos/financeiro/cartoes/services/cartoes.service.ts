import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Cartao } from '../models/cartao.model';
import { CategoriaDespesa } from '../models/categoria-despesa.model';
import { CartaoRequisicao } from '../dtos/cartao-requisicao.dto';

@Injectable({ providedIn: 'root' })
export class CartoesService {
  private readonly base = '/v1/financeiro/cartoes';
  private readonly catBase = '/v1/financeiro/categorias-despesa';

  constructor(private api: ApiService) {}

  listar(): Observable<Resultado<Cartao[]>> {
    return this.api.get<Cartao[]>(this.base);
  }

  obter(id: number): Observable<Resultado<Cartao>> {
    return this.api.get<Cartao>(`${this.base}/${id}`);
  }

  criar(req: CartaoRequisicao): Observable<Resultado<Cartao>> {
    return this.api.post<Cartao>(this.base, req);
  }

  atualizar(id: number, req: CartaoRequisicao): Observable<Resultado<Cartao>> {
    return this.api.put<Cartao>(`${this.base}/${id}`, req);
  }

  listarCategorias(): Observable<Resultado<CategoriaDespesa[]>> {
    return this.api.get<CategoriaDespesa[]>(this.catBase);
  }

  criarCategoria(nome: string): Observable<Resultado<CategoriaDespesa>> {
    return this.api.post<CategoriaDespesa>(this.catBase, { nome });
  }
}
