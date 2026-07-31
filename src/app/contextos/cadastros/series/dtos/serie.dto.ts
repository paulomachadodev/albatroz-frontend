export interface SerieCriarRequisicao {
  escolaId: number;
  nome: string;
}

export interface SerieAtualizarRequisicao {
  nome?: string;
  ativo?: boolean;
}
