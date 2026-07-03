export interface EtlPipelineEntidadeResposta {
  entidade: string;
  pendentes: number;
  processados: number;
  erros: number;
  deadLetter: number;
  ultimaIngestion: string | null;
}
