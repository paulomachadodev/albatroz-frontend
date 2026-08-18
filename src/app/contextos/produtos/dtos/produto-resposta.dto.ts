import { Paginacao } from '../../../core/models';

export interface ProdutoImagemUploadResposta {
  id: number;
  url: string;
  indice: number;
}

export interface ProdutoImportarImagensCorrespondido {
  nomeArquivo: string;
  idProduto: number;
  codigoProduto: string;
  nomeProduto: string;
  indice: number;
  urlResultante?: string;
  erro?: string;
}

export interface ProdutoEstoqueHistoricoItem {
  id: number;
  saldoAnterior?: number;
  saldoNovo?: number;
  variacao?: number;
  origem?: string;
  registradoEm: string;
}

export interface ProdutoEstoqueResposta {
  estoqueAtual: number;
  minimo?: number;
  maximo?: number;
  historico: Paginacao<ProdutoEstoqueHistoricoItem>;
}

export interface ProdutoImportarImagensResposta {
  confirmado: boolean;
  correspondidos: ProdutoImportarImagensCorrespondido[];
  semCorrespondencia: string[];
}
