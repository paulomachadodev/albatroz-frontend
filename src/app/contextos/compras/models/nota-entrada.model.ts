export interface NotaEntradaResumo {
  id: number;
  status: number;
  numeroNota: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  idContatoFornecedor: number | null;
  nomeFornecedor: string | null;
  dataEmissao: string | null;
  valorTotal: number;
  manifestacaoStatus: string | null;
  totalItens: number;
  itensPendentes: number;
  criadoEm: string;
}

export interface NotaEntradaDetalhe {
  id: number;
  status: number;
  numeroNota: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  idContatoFornecedor: number | null;
  nomeFornecedor: string | null;
  dataEmissao: string | null;
  dataEntrada: string | null;
  valorProdutos: number;
  valorFrete: number;
  valorIpi: number;
  valorIcmsSt: number;
  valorDesconto: number;
  valorDespesas: number;
  valorTotal: number;
  metodoRateioFrete: string;
  manifestacaoStatus: string | null;
  criadoEm: string;
  itens: NotaEntradaItem[];
}

export interface NotaEntradaItem {
  id: number;
  numeroItem: number;
  codigoFornecedor: string | null;
  descricaoNota: string | null;
  ncm: string | null;
  cfop: string | null;
  unidadeNota: string | null;
  quantidadeNota: number;
  valorUnitario: number;
  valorTotal: number;
  valorIpiItem: number;
  valorIcmsStItem: number;
  valorDescontoItem: number;
  idProduto: number | null;
  codigoProduto: string | null;
  nomeProduto: string | null;
  fatorConversao: number;
  quantidadeEstoque: number;
  custoUnitarioCalculado: number | null;
  statusMatch: number;
}

export interface ConferenciaNotaResposta {
  id: number;
  numeroNota: string | null;
  serie: string | null;
  nomeFornecedor: string | null;
  dataEmissao: string | null;
  status: number;
  valorTotal: number;
  valorFrete: number;
  dataChegada: string | null;
  itens: ConferenciaItemResposta[];
}

export interface ConferenciaItemResposta {
  id: number;
  numeroItem: number;
  codigoFornecedor: string | null;
  descricaoNota: string | null;
  descricaoConferida: string | null;
  gtinNaNota: string | null;
  unidadeNota: string | null;
  quantidadeNota: number;
  fatorConversao: number;
  quantidadeEstoque: number;
  valorUnitario: number;
  custoUnitarioCalculado: number | null;
  statusMatch: number;
  idProduto: number | null;
  nomeProduto: string | null;
  codigoProduto: string | null;
  gtinProduto: string | null;
  unidadeProduto: string | null;
}

export interface SugestaoDescricaoProduto {
  descricaoSugerida: string;
  confianca: number;
  iaUsada: boolean;
  xProd: string;
  ncm: string | null;
  camposIdentificados: string[];
}

export interface ProdutoCriadoViaNfe {
  idProduto: number;
  codigo: string;
  descricao: string;
  ncm: string | null;
  unidade: string | null;
}
