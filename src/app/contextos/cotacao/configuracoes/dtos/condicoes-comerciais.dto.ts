export interface CondicoesComerciaisAtualizarRequisicao {
  parcelaMinimaValor: number;
  parcelasMaximas: number;
  descontoPixDinheiroPercentual: number;
  descontoEscolaParceiraPercentual: number;
  validadeDias: number;
  textoEntrega: string | null;
  textoRetirada: string | null;
  textoObservacaoCores: string;
  textoAvisoPrecoEstoque: string;
  whatsappAtendimento: string;
  textoHorarioAtendimento: string;
  reconferirPorPreco: boolean;
  reconferirPorEstoque: boolean;
}
