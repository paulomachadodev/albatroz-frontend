export interface IaConsumoFiltro {
  inicio: string;
  fim: string;
  pagina: number;
  tamanhoPagina: number;
  finalidade?: string;
  modelo?: string;
  status?: number;
  modulo?: string;
  provedor?: string;
  fusoHorario?: string;
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

export interface IaConsumoGrupo {
  nome: string;
  tentativas: number;
  custosPendentes: number;
  custoUsd: number | null;
}

export interface IaConsumoDia {
  data: string;
  tentativas: number;
  custosPendentes: number;
  custoUsd: number | null;
}

export interface IaConsumoPainel {
  fusoHorario: string;
  inicioMedicaoUtc: string | null;
  dias: IaConsumoDia[];
  finalidades: IaConsumoGrupo[];
  modelos: IaConsumoGrupo[];
}

export interface IaConsumo {
  habilitado: boolean;
  cobertura: string;
  painel?: IaConsumoPainel;
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
