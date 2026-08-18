export interface ProdutoDadosErpRequisicao {
  quantidadePorCaixa: number | null;
  idMarca: number | null;
}

export interface ProdutoFornecedorCorrecaoRequisicao {
  codigoProdutoFornecedorCorrigido: string | null;
}

export interface ProdutoImagensReordenarRequisicao {
  imagemIds: number[];
}
