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

export interface AlterarProdutoEmMassaItem {
  codigo: string;
  marca?: string | null;
}

export interface AlterarProdutoEmMassaItemResposta {
  codigo: string;
  sucesso: boolean;
  erro?: string;
}

export interface AlterarProdutosEmMassaResposta {
  itens: AlterarProdutoEmMassaItemResposta[];
}

export interface ImportarFornecedorEmMassaItem {
  codigo: string;
  codigoFornecedor: string;
  codigoNoFornecedor?: string | null;
}

export interface ImportarFornecedorEmMassaItemResposta {
  codigo: string;
  codigoFornecedor: string;
  sucesso: boolean;
  erro?: string;
}

export interface ImportarFornecedoresEmMassaResposta {
  itens: ImportarFornecedorEmMassaItemResposta[];
}

export interface ProdutoImportarImagensResposta {
  confirmado: boolean;
  correspondidos: ProdutoImportarImagensCorrespondido[];
  semCorrespondencia: string[];
}
