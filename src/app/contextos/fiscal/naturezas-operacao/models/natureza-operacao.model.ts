export interface NaturezaOperacaoExcecao {
  id?: number;
  tributo: string;
  ufsDestino: string[] | null;
  ncms: string[] | null;
  cfop: string | null;
  situacaoTributaria: string | null;
  aliquota: number | null;
  baseReducao: number | null;
  prioridade: number;
  ativo: number;
}

export interface NaturezaOperacaoDados {
  descricao: string;
  tipo: number;
  finalidade: number;
  regimeTributario: string;
  serie: string | null;
  consumidorFinal: number;
  padraoPara: string | null;
  csosn: string | null;
  cstIcms: string | null;
  cfopDentroUf: string | null;
  cfopForaUf: string | null;
  cfopExterior: string | null;
  difalNaoContribuinte: number;
  ipiCst: string | null;
  ipiAliquota: number | null;
  ipiCodigoEnquadramento: string | null;
  ipiObservacao: string | null;
  issqnCst: string | null;
  issqnAliquota: number | null;
  issqnCodigoEnquadramento: string | null;
  issqnObservacao: string | null;
  pisCst: string | null;
  pisAliquota: number | null;
  pisBaseReducao: number | null;
  pisObservacao: string | null;
  pisInformacaoFisco: string | null;
  cofinsCst: string | null;
  cofinsAliquota: number | null;
  cofinsBaseReducao: number | null;
  cofinsObservacao: string | null;
  cofinsInformacaoFisco: string | null;
  ibsCbsCst: string | null;
  ibsCbsClassificacao: string | null;
  observacaoPadrao: string | null;
  informacaoFisco: string | null;
  precoConsiderado: number;
  enviarExpedicao: number;
  considerarReceitaDre: number;
  considerarCmvDre: number;
  permiteMovimentarEstoque: number;
  compraProdutorRural: number;
  aliquotaFunrural: number | null;
  descontarFunrural: number;
  zonaFrancaManaus: number;
  reducaoBaseIcmsSt: number;
  descontarDesoneracao: number;
  itensCompoemTotal: number;
  ativo: number;
  excecoes: NaturezaOperacaoExcecao[];
}

export interface NaturezaOperacao extends NaturezaOperacaoDados {
  id: number;
}

export interface NaturezaOperacaoResumo {
  id: number;
  descricao: string;
  tipo: number;
  finalidade: number;
  regimeTributario: string;
  padraoPara: string | null;
  csosn: string | null;
  cstIcms: string | null;
  cfopDentroUf: string | null;
  cfopForaUf: string | null;
  quantidadeExcecoes: number;
  ativo: number;
}

export interface TributoResolvido {
  situacaoTributaria: string | null;
  aliquota: number | null;
  baseReducao: number | null;
  idExcecao: number | null;
}

export interface TributacaoResolvida {
  ufOrigem: string;
  ufDestino: string;
  ncm: string | null;
  cfop: string | null;
  idExcecaoCfop: number | null;
  icms: TributoResolvido;
  ipi: TributoResolvido;
  issqn: TributoResolvido;
  pis: TributoResolvido;
  cofins: TributoResolvido;
}
