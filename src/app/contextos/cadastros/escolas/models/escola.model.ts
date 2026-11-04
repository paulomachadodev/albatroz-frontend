export interface Escola {
  id: number;
  empresaId: number;
  nome: string;
  bairro?: string;
  logoUrl?: string | null;
  cidade: string;
  parceira: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
