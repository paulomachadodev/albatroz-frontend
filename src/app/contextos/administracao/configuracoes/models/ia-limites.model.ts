export interface IaLimiteConfiguracao {
  versao: string | null;
  ativo: boolean;
  orcamentoMensalUsd: number | null;
  limiteExecucaoUsd: number | null;
  reservaTentativaUsd: number;
  concorrenciaMaxima: number | null;
  alertaPercentual: number;
  fusoHorario: string;
  destinatarios: string[];
}

export interface IaLimiteReserva {
  tentativaId: string;
  execucaoId: string;
  competencia: string;
  status: number;
  semReserva?: boolean;
  valorReservadoUsd: number;
  valorComprometidoUsd: number;
  iniciadoEmUtc: string;
  concluidoEmUtc: string | null;
}

export interface IaLimites {
  habilitado: boolean;
  cobertura: string;
  configuracao: IaLimiteConfiguracao;
  saldo: {
    competencia: string;
    inicioUtc: string;
    fimUtc: string;
    custoApuradoUsd: number;
    reservadoUsd: number;
    incertoUsd: number;
    comprometidoUsd: number;
    disponivelUsd: number | null;
    emExecucao: number;
    incertas: number;
  };
  reservas: IaLimiteReserva[];
  alertas: {
    id: number;
    tipo: number;
    status: number;
    percentual: number;
    competencia: string;
    comprometidoUsd: number;
    orcamentoUsd: number | null;
    criadoEmUtc: string;
    tentativasEnvio: number;
    ultimoErro: string | null;
  }[];
}
