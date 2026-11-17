export interface IaConsumoFiltro {
  inicio: string;
  fim: string;
  pagina: number;
  tamanhoPagina: number;
  finalidade?: string;
  modelo?: string;
  status?: number;
}

export interface IaConsumoItem {
  id: number;
  tentativaId: string;
  execucaoId: string;
  numeroTentativa: number;
  finalidade: string;
  modulo: string;
  provedor: string;
  modeloSolicitado: string;
  modeloEfetivo: string | null;
  status: number;
  statusApuracao: number;
  httpStatus: number | null;
  iniciadoEmUtc: string;
  concluidoEmUtc: string | null;
  duracaoMs: number | null;
  tokensEntrada: number | null;
  tokensSaida: number | null;
  tokensThinking: number | null;
  tokensCache: number | null;
  custoUsd: number | null;
  tarifaVersao: string | null;
  tarifaFonte: string | null;
}

export interface IaConsumo {
  habilitado: boolean;
  cobertura: string;
  inicioUtc: string;
  fimUtc: string;
  atualizadoEmUtc: string;
  resumo: {
    tentativas: number;
    execucoes: number;
    falhas: number;
    pendentes: number;
    semUsoInformado: number;
    custosPendentes: number;
    custosCalculados: number;
    tokensEntrada: number | null;
    tokensSaida: number | null;
    tokensThinking: number | null;
    tokensCache: number | null;
    custoCalculadoUsd: number | null;
  };
  itens: IaConsumoItem[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
}
