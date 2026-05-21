export interface CotarListaRequisicao {
  itens: {
    descricao: string;
    quantidade: number;
  }[];
}

export interface BuscarSemanticaRequisicao {
  consulta: string;
}
