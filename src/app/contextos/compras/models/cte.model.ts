export interface CteResumo {
  id: number;
  status: number;
  numeroCte: string | null;
  serie: string | null;
  nomeTransportadora: string | null;
  dataEmissao: string | null;
  tipoFrete: string;
  valorTotal: number;
  totalNotasVinculadas: number;
}

export interface CteDetalhe {
  id: number;
  status: number;
  chaveAcesso: string | null;
  numeroCte: string | null;
  serie: string | null;
  idContatoTransportadora: number | null;
  nomeTransportadora: string | null;
  dataEmissao: string | null;
  modalidade: string | null;
  tipoFrete: string;
  metodoRateio: string;
  valorFrete: number;
  valorIcms: number;
  valorTotal: number;
  criadoEm: string;
  notas: CteNotaVinculada[];
}

export interface CteNotaVinculada {
  idNotaEntrada: number;
  numeroNota: string | null;
  nomeFornecedor: string | null;
  valorTotal: number;
  status: number;
}

export interface PreviewRateioCte {
  cteId: number;
  valorFrete: number;
  metodoRateio: string;
  itens: PreviewItemRateio[];
}

export interface PreviewItemRateio {
  idNotaEntrada: number;
  numeroNota: string | null;
  idItem: number;
  numeroItem: number;
  descricaoNota: string | null;
  idProduto: number | null;
  codigoProduto: string | null;
  freteRateado: number;
  custoAtual: number;
  custoComFrete: number;
}
