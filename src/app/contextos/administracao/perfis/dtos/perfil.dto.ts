export interface PerfilCriarRequisicao {
  nome: string;
  descricao?: string;
}

export interface PerfilAtualizarRequisicao {
  nome: string;
  descricao?: string;
}

export interface AtribuirPermissoesRequisicao {
  permissaoIds: number[];
}
