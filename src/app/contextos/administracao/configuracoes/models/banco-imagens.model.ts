export interface BancoImagensConfiguracao {
  habilitado: boolean;
  configurado: boolean;
  chaveFinal: string | null;
  segredoConfigurado: boolean;
  validadaEm: string | null;
  versao: string | null;
}

export interface BancoImagensRequisicao {
  chaveAcesso: string;
  segredo: string | null;
  versaoEsperada: string | null;
}
