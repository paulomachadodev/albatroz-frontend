export interface SubstitutoTributario {
  uf: string;
  inscricaoEstadual: string;
}

export interface DadosEmpresa {
  id: number;
  razaoSocial: string | null;
  nome: string;
  cnpj: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  complemento: string | null;
  cidade: string | null;
  codigoMunicipioIbge: string | null;
  cep: string | null;
  uf: string | null;
  telefone: string | null;
  fax: string | null;
  celular: string | null;
  email: string | null;
  website: string | null;
  segmento: string | null;
  tipoPessoa: string;
  inscricaoEstadual: string | null;
  ieIsento: number;
  inscricaoMunicipal: string | null;
  inscricaoSuframa: string | null;
  cnae: string | null;
  contatoNomeTratamento: string | null;
  contatoCanal: string;
  adminNome: string | null;
  adminEmail: string | null;
  adminCelular: string | null;
  logoUrl: string | null;
  regimeTributario: string | null;
  substitutos: SubstitutoTributario[];
}
