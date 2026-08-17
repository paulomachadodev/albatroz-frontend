export interface Permissao {
  id: number;
  recurso: string;
  acao: string;
  descricao: string;
}

export interface Perfil {
  id: number;
  nome: string;
  descricao?: string;
  permissoes: Permissao[];
}
