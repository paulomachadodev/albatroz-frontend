import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../core/models';
import { ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { ProdutoDetalhe, ProdutoResumo, ProdutoTipo } from '../models/produto.model';
import {
  ProdutoDadosErpRequisicao,
  ProdutoFornecedorCorrecaoRequisicao,
  ProdutoImagensReordenarRequisicao
} from '../dtos/produto-requisicao.dto';
import { ProdutoImagemUploadResposta, ProdutoImportarImagensResposta } from '../dtos/produto-resposta.dto';

export interface ProdutoFiltro {
  texto?: string;
  tipo?: ProdutoTipo;
  situacao?: string;
  temImagem?: boolean;
  tinyIdFornecedor?: number;
  idCategoria?: number;
  idMarca?: number;
}

@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private endpoint = '/v1/produtos';

  constructor(private api: ApiService) {}

  listar(paginacao: ParametrosPaginacao, filtros?: ProdutoFiltro): Observable<Resultado<Paginacao<ProdutoResumo>>> {
    return this.api.getPaginado<ProdutoResumo>(this.endpoint, paginacao, filtros);
  }

  obter(id: number): Observable<Resultado<ProdutoDetalhe>> {
    return this.api.get<ProdutoDetalhe>(`${this.endpoint}/${id}`);
  }

  atualizarDadosErp(id: number, requisicao: ProdutoDadosErpRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/dados-erp`, requisicao);
  }

  corrigirFornecedor(id: number, tinyIdFornecedor: number, requisicao: ProdutoFornecedorCorrecaoRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/fornecedores/${tinyIdFornecedor}/correcao`, requisicao);
  }

  uploadImagem(id: number, arquivo: File): Observable<Resultado<ProdutoImagemUploadResposta>> {
    const formData = new FormData();
    formData.append('file', arquivo);
    return this.api.post<ProdutoImagemUploadResposta>(`${this.endpoint}/${id}/imagens`, formData);
  }

  reordenarImagens(id: number, requisicao: ProdutoImagensReordenarRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/imagens/reordenar`, requisicao);
  }

  excluirImagem(id: number, imagemId: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}/imagens/${imagemId}`);
  }

  importarImagensLote(arquivos: File[], confirmar: boolean): Observable<Resultado<ProdutoImportarImagensResposta>> {
    const formData = new FormData();
    arquivos.forEach(arquivo => formData.append('files', arquivo));
    formData.append('confirmar', String(confirmar));
    return this.api.post<ProdutoImportarImagensResposta>(`${this.endpoint}/imagens/importar-lote`, formData);
  }
}
