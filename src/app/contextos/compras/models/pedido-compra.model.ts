export const SITUACAO_PEDIDO_COMPRA = { RASCUNHO: 1, PRONTO: 2, ENVIADO: 3, CANCELADO: 4 } as const;

export interface PedidoCompraResumo {
  id: number;
  idFornecedor: number;
  fornecedor: string;
  situacao: number;
  valorTotal: number;
  quantidadeItens: number;
  criadoEm: string;
}

export interface PedidoCompraItem {
  idProduto: number;
  codigo: string;
  nome: string;
  quantidade: number;
  precoCustoUnitario: number;
  valorTotal: number;
}

export interface PedidoCompraDetalhe {
  id: number;
  idFornecedor: number;
  fornecedor: string;
  telefoneFornecedor?: string;
  emailFornecedor?: string;
  situacao: number;
  valorTotal: number;
  observacoes?: string;
  criadoEm: string;
  itens: PedidoCompraItem[];
}

export interface CriarPedidoCompraItem {
  idProduto: number;
  quantidade: number;
}

export interface CriarPedidoCompraRequisicao {
  idFornecedor: number;
  observacoes?: string | null;
  itens: CriarPedidoCompraItem[];
}
