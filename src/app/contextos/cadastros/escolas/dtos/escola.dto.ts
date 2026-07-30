export interface EscolaCriarRequisicao {
  nome: string;
  bairro?: string;
  cidade?: string;
}

export interface EscolaAtualizarRequisicao {
  nome?: string;
  bairro?: string;
  cidade?: string;
  parceira?: boolean;
}
