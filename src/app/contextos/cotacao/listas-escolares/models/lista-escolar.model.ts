export interface ListaEscolarResumo {
  id: number;
  escolaNome?: string;
  idSerie?: number;
  serie?: string;
  anoLetivo?: number;
  status: string;
  totalEstimado?: number;
  totalItens: number;
  itensLiberados: number;
  criadoEm: string;
}

export interface ListaEscolarItem {
  id: number;
  descricaoNaLista: string;
  marcaNaLista?: string;
  categoriaItem?: string;
  quantidade: number;
  idProduto?: number;
  codigoProduto?: string;
  nomeProduto?: string;
  precoUnitario?: number;
  subtotal?: number;
  statusItem: string;
  liberado: boolean;
}

export interface ListaEscolarDetalhe {
  id: number;
  idEscola?: number;
  escolaNome?: string;
  idSerie?: number;
  serie?: string;
  anoLetivo?: number;
  status: string;
  totalEstimado?: number;
  pdfCotacaoUrl?: string;
  itens: ListaEscolarItem[];
}

export interface ProdutoBusca {
  id: number;
  codigo: string;
  nome: string;
  preco?: number;
  estoque?: number;
}
