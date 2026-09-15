export interface ProdutoPrioridadeContagem {
  idProduto: number;
  codigo: string;
  nome: string;
  marca: string | null;
  estoqueAtual: number;
  classeAbc: string | null;
  diasSemVenda: number | null;
  score: number;
  ultimaContagemEm: string | null;
}

export interface ItemImportacaoContagem {
  codigo: string;
  quantidadeContada: number;
}

export interface ItemPreviewContagem {
  idProduto: number | null;
  codigo: string;
  nome: string | null;
  quantidadeSistema: number | null;
  quantidadeContada: number;
  diferenca: number | null;
  percentualDiferenca: number | null;
  requerAtencao: boolean;
  erro: string | null;
}

export interface PreviewContagem {
  itens: ItemPreviewContagem[];
  totalValidos: number;
  totalComErro: number;
}

export interface ItemConfirmarContagem {
  idProduto: number;
  quantidadeContada: number;
}
