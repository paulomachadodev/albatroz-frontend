export interface Configuracao {
  chave: string;
  valor?: string;
  descricao?: string;
  atualizadoEm: string;
}

export interface EmpresaCertificado {
  id: number;
  cnpj?: string;
  nomeTitular?: string;
  validade?: string;
  ambienteNfe: string;
  ativo: boolean;
  expirandoEm30Dias: boolean;
  criadoEm: string;
}
