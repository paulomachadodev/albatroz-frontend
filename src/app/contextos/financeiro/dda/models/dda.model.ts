export interface ImportacaoDda {
  id: number;
  banco: string;
  arquivoNome: string;
  dataImportacao: string;
  totalLancamentos: number;
  totalValor: number;
  status: number;
  totalMatchados: number;
  totalPendentes: number;
}

export interface LancamentoDda {
  id: number;
  codigoBarras: string | null;
  nomeEmissor: string | null;
  cnpjEmissor: string | null;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  statusConciliacao: number;
  idContaPagar: number | null;
  nomeFornecedorContaPagar: string | null;
  vencimentoContaPagar: string | null;
  valorContaPagar: number | null;
}

export interface DetalheImportacaoDda {
  importacao: ImportacaoDda;
  lancamentos: LancamentoDda[];
}
