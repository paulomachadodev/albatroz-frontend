export interface ContaPagar {
  id: number;
  fornecedor: string | null;
  numeroDocumento: string | null;
  historico: string | null;
  dataVencimento: string | null;
  dataPagamento: string | null;
  competencia: string | null;
  valor: number;
  saldo: number;
  valorPago: number | null;
  situacao: number;
  parcela: number | null;
  numeroParcelas: number | null;
  diasAtraso: number;
}

export type FiltroVencimento = 'todas' | 'vencidas' | 'vence-hoje';

export interface DarBaixaContaPagarRequisicao {
  dataPagamento: string;
  valorPago: number;
}

export interface CriarContaPagarRequisicao {
  idContato: number | null;
  valor: number;
  historico: string | null;
  dataVencimento: string;
  competencia: string;
  numeroDocumento: string | null;
  parcela: number | null;
  numeroParcelas: number | null;
}

export type FiltroContasPagar = FiltroVencimento;
