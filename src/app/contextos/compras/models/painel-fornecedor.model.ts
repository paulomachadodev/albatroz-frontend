export interface PainelFornecedor {
  idFornecedor: number;
  fornecedor: string;

  valorSugeridoTotal: number;
  valorPedidoMinimo?: number;
  atingiuMinimo: boolean;

  giroMedio?: number;
  lucratividadeEstimada90d?: number;
  prazoEntregaDias?: number;

  // 0 até o backfill de erp.conta_pagar.id_contato rodar (ETL corrigido, dado histórico
  // pendente de reprocessamento manual) — ver scripts/Albatroz.ETL/20260827_1400_*.
  saldoEmAberto: number;
}
