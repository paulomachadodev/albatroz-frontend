export interface ProdutoDadosErpRequisicao {
  quantidadePorCaixa: number | null;
}

export interface ProdutoImagensReordenarRequisicao {
  imagemIds: number[];
}

export interface AdicionarFornecedorProdutoRequisicao {
  idContato: number;
  codigoNoFornecedor: string | null;
  principal: boolean;
}

export interface AtualizarFornecedorProdutoRequisicao {
  codigoNoFornecedor: string | null;
}

export interface CriarListaPrecoRequisicao {
  nome: string;
  tipo: string;
  modoCalculo: 'percentual_venda' | 'percentual_custo';
  percentual: number;
}

export interface AtualizarListaPrecoRequisicao {
  nome: string;
  tipo: string;
  modoCalculo: 'percentual_venda' | 'percentual_custo';
  percentual: number;
  ativo: boolean;
}

export interface AtualizarEnriquecimentoProdutoRequisicao {
  seoTitle: string | null;
  seoDescription: string | null;
  seoSlug: string | null;
  googleProductCategory: string | null;
  googleBrand: string | null;
  googleGtin: string | null;
  condicao: string | null;
  tag: string[] | null;
  sinonimos: string[] | null;
  descricaoEnriquecida: string | null;
  descricaoLonga: string | null;
  descricaoUso: string | null;
  publicoFaixa: string[] | null;
  publicoGenero: string[] | null;
  cor: string | null;
  tamanho: string | null;
  material: string | null;
}
