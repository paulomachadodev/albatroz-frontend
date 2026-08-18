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
import { ProdutoImagemUploadResposta, ProdutoImportarImagensResposta, ProdutoEstoqueResposta } from '../dtos/produto-resposta.dto';

export interface ProdutoFiltro {
  texto?: string;
  tipo?: ProdutoTipo;
  situacao?: string;
  temImagem?: boolean;
  tinyIdFornecedor?: number;
  idCategoria?: number;
  idMarca?: number;
  ordenarPor?: string;
  direcao?: 'asc' | 'desc';
}

export interface EstadoListaProdutos {
  filtro: ProdutoFiltro;
  pagina: number;
  tamanhoPagina: number;
}

@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private endpoint = '/v1/produtos';

  // Guarda filtro/página/ordenação da última listagem pra restaurar quando o usuário
  // volta da tela de detalhe (em vez de resetar a busca do zero).
  estadoLista: EstadoListaProdutos | null = null;

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

  uploadImagem(id: number, arquivo: File, indice: number): Observable<Resultado<ProdutoImagemUploadResposta>> {
    const formData = new FormData();
    formData.append('file', arquivo);
    return this.api.post<ProdutoImagemUploadResposta>(`${this.endpoint}/${id}/imagens?indice=${indice}`, formData);
  }

  obterEstoque(id: number, pagina: number, tamanho: number): Observable<Resultado<ProdutoEstoqueResposta>> {
    return this.api.get<ProdutoEstoqueResposta>(`${this.endpoint}/${id}/estoque`, { pagina, tamanho });
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
