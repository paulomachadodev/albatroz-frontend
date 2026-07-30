export interface Escola {
  id: number;
  empresaId: number;
  nome: string;
  bairro?: string;
  cidade: string;
  parceira: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
