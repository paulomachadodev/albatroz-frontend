export interface ProdutoPrioridadeContagem {
  idProduto: number;
  codigo: string;
  gtin: string | null;
  nome: string;
  marca: string | null;
  estoqueAtual: number;
  classeAbc: string | null;
  diasSemVenda: number | null;
  score: number;
  ultimaContagemEm: string | null;
}

export interface FiltroPrioridadeContagem {
  idMarca?: number;
  comEstoque?: boolean;
  curvaAbc?: string;
}

export interface OrdenacaoPrioridadeContagem {
  campo: string;
  direcao: 'asc' | 'desc';
}

export interface ItemImportacaoContagem {
  codigo: string;
  quantidadeContada: number;
  quantidadeSistemaExportacao: number | null;
}

export interface ItemPreviewContagem {
  idProduto: number | null;
  codigo: string;
  nome: string | null;
  quantidadeExportacao: number | null;
  quantidadeAtual: number | null;
  quantidadeContada: number;
  diferencaReal: number | null;
  novoSaldoEstimado: number | null;
  percentualDiferenca: number | null;
  usouSaldoAtualComoBase: boolean;
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
  quantidadeSistemaExportacao: number | null;
}
