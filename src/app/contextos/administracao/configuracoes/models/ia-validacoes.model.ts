export interface IaValidacao {
  id: number;
  modelo: string;
  modeloEfetivo: string | null;
  status: number;
  httpStatus: number | null;
  criadoEmUtc: string;
  atualizadoEmUtc: string;
  tokensEntrada: number | null;
  tokensSaida: number | null;
  tokensThinking: number | null;
  tokensCache: number | null;
  custo: number | null;
}

export interface IaValidacoes {
  habilitado: boolean;
  cobertura: 'validacoes_google';
  inicioUtc: string;
  fimUtc: string;
  atualizadoEmUtc: string;
  resumo: {
    tentativas: number;
    validadas: number;
    falhas: number;
    pendentes: number;
    indeterminadas: number;
    conflitos: number;
    tokensEntrada: number | null;
    tokensSaida: number | null;
    tokensThinking: number | null;
    tokensCache: number | null;
    semUsoInformado: number;
    custo: number | null;
  };
  itens: IaValidacao[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
}
