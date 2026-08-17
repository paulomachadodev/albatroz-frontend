export interface Usuario {
  id: number;
  nome: string;
  email: string;
  situacao: string;
  deveAlterarSenha: boolean;
  ultimoAcesso?: string;
  perfis: string[];
  criadoEm: string;
}
