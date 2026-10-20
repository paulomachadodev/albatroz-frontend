export interface Usuario {
  id: number;
  nome: string;
  email: string;
  nomeUsuario?: string;
  situacao: string;
  deveAlterarSenha: boolean;
  conviteEnviado?: boolean;
  ultimoAcesso?: string;
  perfis: string[];
  criadoEm: string;
}
