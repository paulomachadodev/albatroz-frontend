export const SITUACAO_PEDIDO_COMPRA = { RASCUNHO: 1, PRONTO: 2, ENVIADO: 3, CANCELADO: 4 } as const;

export const SITUACOES_EDITAVEIS_PEDIDO_COMPRA: readonly number[] = [SITUACAO_PEDIDO_COMPRA.RASCUNHO, SITUACAO_PEDIDO_COMPRA.PRONTO];

export const ROTULOS_SITUACAO_PEDIDO_COMPRA: Record<number, string> = { 1: 'Rascunho', 2: 'Pronto', 3: 'Enviado', 4: 'Cancelado' };

export const CLASSES_SITUACAO_PEDIDO_COMPRA: Record<number, string> = {
  1: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  4: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
};

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

export interface AtualizarItensPedidoCompraRequisicao {
  itens: CriarPedidoCompraItem[];
}
