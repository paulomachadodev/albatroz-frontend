export interface UsuarioCriarRequisicao {
  nome: string;
  email: string;
  senha: string;
  nomeUsuario?: string;
}

export interface UsuarioAtualizarRequisicao {
  nome: string;
  email: string;
  nomeUsuario?: string;
}

export interface AtribuirPerfisRequisicao {
  perfilIds: number[];
}
