import { MotivoPendenciaItem, MotivoReconferenciaItem, StatusItemListaEscolar, StatusListaEscolar } from './lista-escolar-status';

export interface ListaEscolarResumo {
  id: number;
  escolaNome?: string;
  idSerie?: number;
  serie?: string;
  anoLetivo?: number;
  status: StatusListaEscolar;
  totalEstimado?: number;
  totalItens: number;
  itensLiberados: number;
  criadoEm: string;
}

export interface ListaEscolarItem {
  id: number;
  descricaoNaLista: string;
  marcaNaLista?: string;
  idCategoria?: number;
  categoriaItem?: string;
  nomeSecaoOriginal?: string;
  linhaOriginal?: string;
  quantidade: number;
  idProduto?: number;
  codigoProduto?: string;
  nomeProduto?: string;
  precoUnitario?: number;
  subtotal?: number;
  statusItem: StatusItemListaEscolar;
  liberado: boolean;
  pendenteRevisao: boolean;
  motivoPendencia?: MotivoPendenciaItem;
  motivoReconferencia?: MotivoReconferenciaItem;
  precoAnterior?: number;
}

export interface ListaEscolarDetalhe {
  id: number;
  idEscola?: number;
  escolaNome?: string;
  escolaLogoUrl?: string;
  idSerie?: number;
  serie?: string;
  anoLetivo?: number;
  status: StatusListaEscolar;
  totalEstimado?: number;
  pdfCotacaoUrl?: string;
  pdfGeradoEm?: string;
  itens: ListaEscolarItem[];
}

export interface ProdutoBusca {
  id: number;
  codigo: string;
  nome: string;
  preco?: number;
  estoque?: number;
}

export interface CategoriaListaEscolar {
  id: number;
  nome: string;
  pularBuscaProduto: boolean;
  totalItens: number;
}
