export interface GeracaoMarketingResultado {
  legenda: string;
  cta: string;
  hashtags: string[];
  ideiaVisual: string;
  roteiro: string[];
}

export interface GeracaoMarketing {
  id: string;
  briefingId: number;
  status: number;
  criadoEmUtc: string;
  atualizadoEmUtc: string;
  marcaVersao: string;
  estrategiaVersao: string;
  briefingVersao: string;
  resultado: GeracaoMarketingResultado | null;
  erro: string | null;
}

export interface GeracaoMarketingLista {
  habilitado: boolean;
  itens: GeracaoMarketing[];
}
