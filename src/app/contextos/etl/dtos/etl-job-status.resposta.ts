export interface EtlJobStatusResposta {
  jobId: string;
  displayName: string;
  entidade: string;
  cronExpression: string;
  pausado: boolean;
  ultimoEstado: string | null;
  ultimaExecucao: string | null;
  proximaExecucao: string | null;
  pendentesStagingCount: number;
}
