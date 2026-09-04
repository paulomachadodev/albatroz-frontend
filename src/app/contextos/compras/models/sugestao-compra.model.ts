export interface SugestaoCompra {
  idProduto: number;
  codigo: string;
  nome: string;
  gtin?: string;
  marca?: string;
  fornecedor?: string;
  curvaAbc?: string;

  estoqueAtual: number;
  precoCusto?: number;
  giroDiarioProjetado?: number;
  diasCoberturaEstoque?: number;

  vendido30d?: number;
  vendido60d?: number;
  vendido90d?: number;
  vendidoPeriodo?: number;

  sugestaoCompraQtd90d?: number;
  valorTotalSugerido90d?: number;

  quantidadePorCaixa?: number;
  caixasSugeridas?: number;
  quantidadeAjustada?: number;
  valorTotalAjustado?: number;
  coberturaDiasComCompra?: number;

  prazoEntregaDias?: number;
  valorPedidoMinimo?: number;
  alertaReposicaoUrgente: boolean;
  abaixoPedidoMinimo: boolean;

  dataUltimaVenda?: string;
  dataUltimaCompra?: string;
  precoUltimaCompra?: number;
}
