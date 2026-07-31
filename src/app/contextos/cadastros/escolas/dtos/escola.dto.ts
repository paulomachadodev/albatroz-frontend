export interface EscolaCriarRequisicao {
  nome: string;
  bairro?: string;
  cidade?: string;
  parceira?: boolean;
  ativo?: boolean;
}

export interface EscolaAtualizarRequisicao {
  nome?: string;
  bairro?: string;
  cidade?: string;
  parceira?: boolean;
  ativo?: boolean;
}

export interface SerieCriarRequisicao {
  nome: string;
}

export interface SerieAtualizarRequisicao {
  nome?: string;
  ativo?: boolean;
}
