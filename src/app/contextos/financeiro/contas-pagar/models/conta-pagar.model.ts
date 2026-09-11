export interface ContaPagar {
  id: number;
  fornecedor: string | null;
  numeroDocumento: string | null;
  historico: string | null;
  dataVencimento: string | null;
  valor: number;
  saldo: number;
  diasAtraso: number;
}

export type FiltroContasPagar = 'vencidas' | 'vence-hoje' | 'todas';
