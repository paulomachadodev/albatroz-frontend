export interface ListaEscolarItemAtualizarRequisicao {
  idProduto?: number;
  quantidade?: number;
  naoVendemos: boolean;
  naoTemos?: boolean;
  categoriaNome?: string;
}

export interface ListaEscolarAtualizarRequisicao {
  idEscola?: number;
  idSerie?: number;
}

export interface ListaEscolarItemAdicionarRequisicao {
  descricaoNaLista: string;
  quantidade: number;
  idProduto?: number;
}
