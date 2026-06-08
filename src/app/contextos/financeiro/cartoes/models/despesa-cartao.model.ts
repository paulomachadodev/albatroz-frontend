export interface DespesaCartao {
  id?: number;
  empresaId?: number;
  idFatura: number;
  idContatoPortador?: number;
  idCategoriaDespesa?: number;
  portadorNome?: string;
  dataCompra: string;
  descricaoOriginal: string;
  descricaoEditada?: string;
  valor: number;
  parcelaAtual: number;
  totalParcelas: number;
  origem: number; // 1=Fatura, 2=Projetada, 3=Manual
  status: number; // 1=Pendente, 2=Confirmada, 3=Paga
  previsaoEncontrada?: boolean; // flag UI — reconciliada com projeção
  cartaoId?: number | null;
  finalCartao?: string | null;
}

export interface ParcelaProjetada {
  descricaoOriginal: string;
  valor: number;
  parcelaAtual: number;
  totalParcelas: number;
  selecionada: boolean;
  parcelas: ParcelaMes[];
}

export interface ParcelaMes {
  mes: number;
  ano: number;
  valor: number;
}
