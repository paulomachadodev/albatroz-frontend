export interface Cartao {
  id: number;
  empresaId: number;
  idCartaoPrincipal?: number | null;
  idContatoPortador?: number;
  portadorNome?: string;
  ultimos4Digitos: string;
  apelido: string;
  bandeira?: string;
  diaVencimento: number;
  diaFechamento: number;
  limiteTotal: number;
  limiteUsado: number;
  limiteDisponivel: number;
  ativo: number;
  criadoEm: string;
  ehAdicional?: boolean;
  adicionais?: Cartao[];
}
