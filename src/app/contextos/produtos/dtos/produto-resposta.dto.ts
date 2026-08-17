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
}

export interface ProdutoImportarImagensResposta {
  confirmado: boolean;
  correspondidos: ProdutoImportarImagensCorrespondido[];
  semCorrespondencia: string[];
}
