export interface ProdutoDadosErpRequisicao {
  quantidadePorCaixa: number | null;
}

export interface ProdutoFornecedorCorrecaoRequisicao {
  codigoProdutoFornecedorCorrigido: string | null;
}

export interface ProdutoImagensReordenarRequisicao {
  imagemIds: number[];
}
