export interface EmpresaCriarRequisicao {
  nome: string;
  cnpj?: string;
  ativo?: boolean;
}

export interface EmpresaAtualizarRequisicao {
  nome?: string;
  cnpj?: string;
  ativo?: boolean;
}
