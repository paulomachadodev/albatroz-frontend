export interface RelatorioVendaProduto {
  idProduto: number;
  sku: string;
  descricao: string;
  marca?: string;
  fornecedor?: string;
  quantidadeVendida: number;
  valorMedioVenda: number;
  valorTotalVenda: number;
  urlFoto?: string;
  estoqueAtual: number;
  totalGeral: number;
  totalQuantidadeGeral: number;
  totalValorGeral: number;
}

export interface RelatorioVendaProdutosFiltro {
  texto?: string;
  idsMarca?: number[];
  idFornecedor?: number;
  dataInicio?: string;
  dataFim?: string;
  ordenarPor?: string;
  direcao?: string;
}
