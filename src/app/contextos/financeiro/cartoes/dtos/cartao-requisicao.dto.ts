export interface CartaoRequisicao {
  idCartaoPrincipal?: number | null;
  idContatoPortador?: number;
  ultimos4Digitos: string;
  apelido: string;
  bandeira?: string;
  diaVencimento: number;
  diaFechamento: number;
  limiteTotal: number;
}
