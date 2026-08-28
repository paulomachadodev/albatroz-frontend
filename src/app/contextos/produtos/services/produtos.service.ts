import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../core/models';
import { ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { ProdutoDetalhe, ProdutoResumo, ProdutoTipo, ListaPreco, ProdutoEnriquecimento, MarketplaceProduto, ProdutoAnalise, ImagemCandidata } from '../models/produto.model';
import {
  ProdutoDadosErpRequisicao,
  ProdutoImagensReordenarRequisicao,
  AdicionarFornecedorProdutoRequisicao,
  AtualizarFornecedorProdutoRequisicao,
  CriarListaPrecoRequisicao,
  AtualizarListaPrecoRequisicao,
  AtualizarEnriquecimentoProdutoRequisicao
} from '../dtos/produto-requisicao.dto';
import {
  ProdutoImagemUploadResposta, ProdutoImportarImagensResposta, ProdutoEstoqueResposta,
  AlterarProdutoEmMassaItem, AlterarProdutosEmMassaResposta,
  ImportarFornecedorEmMassaItem, ImportarFornecedoresEmMassaResposta
} from '../dtos/produto-resposta.dto';

export interface ProdutoFiltro {
  texto?: string;
  tipo?: ProdutoTipo;
  situacao?: string;
  temImagem?: boolean;
  tinyIdFornecedor?: number;
  idFornecedor?: number;
  idCategoria?: number;
  idMarca?: number;
  comEstoque?: boolean;
  ordenarPor?: string;
  direcao?: 'asc' | 'desc';
}

export interface EstadoListaProdutos {
  filtro: ProdutoFiltro;
  pagina: number;
  tamanhoPagina: number;
}

export interface ImagemCandidataFiltro {
  texto?: string;
  status?: number[];
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

  uploadImagem(id: number, arquivo: File, indice: number): Observable<Resultado<ProdutoImagemUploadResposta>> {
    const formData = new FormData();
    formData.append('file', arquivo);
    return this.api.post<ProdutoImagemUploadResposta>(`${this.endpoint}/${id}/imagens?indice=${indice}`, formData);
  }

  uploadImagemPorUrl(id: number, url: string): Observable<Resultado<ProdutoImagemUploadResposta>> {
    return this.api.post<ProdutoImagemUploadResposta>(`${this.endpoint}/${id}/imagens/url`, { url });
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

  excluirTodasImagens(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}/imagens`);
  }

  // ---- Imagens candidatas (busca automática por GTIN, revisão manual) ----

  listarImagensCandidatas(paginacao: ParametrosPaginacao, filtro?: ImagemCandidataFiltro): Observable<Resultado<Paginacao<ImagemCandidata>>> {
    return this.api.getPaginado<ImagemCandidata>(`${this.endpoint}/imagens-candidatas`, paginacao, filtro);
  }

  aprovarImagemCandidata(idCandidata: number): Observable<Resultado<ProdutoImagemUploadResposta>> {
    return this.api.put<ProdutoImagemUploadResposta>(`${this.endpoint}/imagens-candidatas/${idCandidata}/aprovar`, {});
  }

  alterarStatusImagemCandidata(idCandidata: number, status: number): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/imagens-candidatas/${idCandidata}/status`, { status });
  }

  alterarEmMassa(itens: AlterarProdutoEmMassaItem[]): Observable<Resultado<AlterarProdutosEmMassaResposta>> {
    return this.api.post<AlterarProdutosEmMassaResposta>(`${this.endpoint}/alterar-em-massa`, { itens });
  }

  migrarImagensTinyParaR2(): Observable<Resultado<{ idJob: string }>> {
    return this.api.post<{ idJob: string }>(`${this.endpoint}/imagens/migrar-tiny-r2`, {});
  }

  importarImagensLote(arquivos: File[], confirmar: boolean): Observable<Resultado<ProdutoImportarImagensResposta>> {
    const formData = new FormData();
    arquivos.forEach(arquivo => formData.append('files', arquivo));
    formData.append('confirmar', String(confirmar));
    return this.api.post<ProdutoImportarImagensResposta>(`${this.endpoint}/imagens/importar-lote`, formData);
  }

  // ---- Fornecedores (aba Fornecedores — produto_fornecedor_erp) ----

  adicionarFornecedor(id: number, requisicao: AdicionarFornecedorProdutoRequisicao): Observable<Resultado<{ id: number }>> {
    return this.api.post<{ id: number }>(`${this.endpoint}/${id}/fornecedores`, requisicao);
  }

  atualizarFornecedor(id: number, idFornecedorErp: number, requisicao: AtualizarFornecedorProdutoRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/fornecedores/${idFornecedorErp}`, requisicao);
  }

  definirFornecedorPrincipal(id: number, idFornecedorErp: number): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/fornecedores/${idFornecedorErp}/principal`, {});
  }

  removerFornecedor(id: number, idFornecedorErp: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}/fornecedores/${idFornecedorErp}`);
  }

  importarFornecedoresEmMassa(itens: ImportarFornecedorEmMassaItem[]): Observable<Resultado<ImportarFornecedoresEmMassaResposta>> {
    return this.api.post<ImportarFornecedoresEmMassaResposta>(`${this.endpoint}/fornecedores/importar-em-massa`, { itens });
  }

  // ---- Listas de preço (aba Preço) ----

  listarListasPreco(): Observable<Resultado<ListaPreco[]>> {
    return this.api.get<ListaPreco[]>(`${this.endpoint}/listas-preco`);
  }

  criarListaPreco(requisicao: CriarListaPrecoRequisicao): Observable<Resultado<{ id: number }>> {
    return this.api.post<{ id: number }>(`${this.endpoint}/listas-preco`, requisicao);
  }

  atualizarListaPreco(idLista: number, requisicao: AtualizarListaPrecoRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/listas-preco/${idLista}`, requisicao);
  }

  // ---- Enriquecimento (aba Web — SEO/Google/Tags) ----

  obterEnriquecimento(id: number): Observable<Resultado<ProdutoEnriquecimento>> {
    return this.api.get<ProdutoEnriquecimento>(`${this.endpoint}/${id}/enriquecimento`);
  }

  atualizarEnriquecimento(id: number, requisicao: AtualizarEnriquecimentoProdutoRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/enriquecimento`, requisicao);
  }

  reenriquecer(id: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${id}/reenriquecer`, {});
  }

  // ---- Marketplaces (Google/Meta/Site) ----

  listarMarketplaces(id: number): Observable<Resultado<MarketplaceProduto[]>> {
    return this.api.get<MarketplaceProduto[]>(`${this.endpoint}/${id}/marketplaces`);
  }

  definirMarketplace(id: number, codigo: string, habilitado: boolean): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/marketplaces/${codigo}`, { habilitado });
  }

  definirMarketplaceEmMassa(idsProduto: number[], marketplace: string, habilitado: boolean): Observable<Resultado<{ alterados: number }>> {
    return this.api.post<{ alterados: number }>(`${this.endpoint}/marketplaces/alterar-em-massa`, { idsProduto, marketplace, habilitado });
  }

  // ---- Análise ----

  obterAnalise(id: number): Observable<Resultado<ProdutoAnalise>> {
    return this.api.get<ProdutoAnalise>(`${this.endpoint}/${id}/analise`);
  }
}
