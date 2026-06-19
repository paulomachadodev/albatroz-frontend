export interface EtlPipelinePedidosResposta {
  pendentes: number;
  processados: number;
  erros: number;
  deadLetter: number;
  totalErpPedidos: number;
  ultimaIngestion: string | null;
}
