import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../core/models';
import { ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { Produto } from '../models/produto.model';
import { ProdutoRequisicao, ProdutoUploadImagemRequisicao } from '../dtos/produto-requisicao.dto';
import { ProdutoUploadImagemResposta } from '../dtos/produto-resposta.dto';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {
  private endpoint = '/interno/v1/produtos';

  constructor(private api: ApiService) {}

  listar(paginacao: ParametrosPaginacao, filtros?: any): Observable<Resultado<Paginacao<Produto>>> {
    return this.api.getPaginado<Produto>(this.endpoint, paginacao, filtros);
  }

  obter(id: number): Observable<Resultado<Produto>> {
    return this.api.get<Produto>(`${this.endpoint}/${id}`);
  }

  criar(requisicao: ProdutoRequisicao): Observable<Resultado<Produto>> {
    return this.api.post<Produto>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: ProdutoRequisicao): Observable<Resultado<Produto>> {
    return this.api.put<Produto>(`${this.endpoint}/${id}`, requisicao);
  }

  deletar(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  uploadImagem(id: number, arquivo: File): Observable<Resultado<ProdutoUploadImagemResposta>> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return this.api.post<ProdutoUploadImagemResposta>(`${this.endpoint}/${id}/imagens`, formData);
  }
}
