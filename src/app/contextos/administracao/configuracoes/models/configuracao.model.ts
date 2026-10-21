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

export interface EmpresaIntegracao {
  regimeTributario: string;
  icmsRecuperavel: boolean;
  pisCofinsRecuperavel: boolean;
  tinyAtivo: boolean;
  tinyPush: boolean;
  tinyNfeSaida: boolean;
  tinyPdv: boolean;
}

export interface EmpresaConfigCnab {
  id: number;
  banco: string;
  agencia?: string;
  conta?: string;
  convenio?: string;
  layoutCnab: string;
  descricao?: string;
  ativo: boolean;
  criadoEm: string;
}
