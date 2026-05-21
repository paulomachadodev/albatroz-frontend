export interface ProdutoRequisicao {
  nome: string;
  descricao: string;
  sku: string;
  preco: number;
  estoque: number;
}

export interface ProdutoUploadImagemRequisicao {
  arquivo: File;
}
