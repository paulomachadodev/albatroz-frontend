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
