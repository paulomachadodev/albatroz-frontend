export interface ListaEscolarItemAtualizarRequisicao {
  idProduto?: number;
  quantidade?: number;
  naoVendemos: boolean;
}

export interface ListaEscolarAtualizarRequisicao {
  idEscola?: number;
  escolaNome?: string;
  serie?: string;
  turma?: string;
  turno?: string;
}

export interface ListaEscolarItemAdicionarRequisicao {
  descricaoNaLista: string;
  quantidade: number;
  idProduto?: number;
}
