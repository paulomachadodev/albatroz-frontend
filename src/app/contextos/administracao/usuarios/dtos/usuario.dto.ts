export interface UsuarioCriarRequisicao {
  nome: string;
  email: string;
  senha: string;
}

export interface UsuarioAtualizarRequisicao {
  nome: string;
  email: string;
}

export interface AtribuirPerfisRequisicao {
  perfilIds: number[];
}
