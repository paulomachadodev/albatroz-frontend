export interface Escola {
  id: number;
  empresaId: number;
  nome: string;
  bairro?: string;
  cidade: string;
  parceira: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
