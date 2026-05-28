export interface Fatura {
  id: number;
  empresaId: number;
  idCartao: number;
  cartaoApelido?: string;
  mesReferencia: number;
  anoReferencia: number;
  dataVencimento: string;
  dataFechamento?: string;
  valorTotal: number;
  taxasAnuidades: number;
  status: number; // 1=Aberta, 2=Processada, 3=Paga
  pdfUrl?: string;
  criadoEm: string;
}
