export type StatusConexaoTiny = 'nao_validada' | 'conectada' | 'erro';

export interface IntegracaoTiny {
  configurada: boolean;
  clientId: string | null;
  clientSecretMascarado: string | null;
  statusConexao: StatusConexaoTiny;
  mensagemErro: string | null;
  validadaEm: string | null;
  ativo: boolean;
}

export interface SalvarIntegracaoTinyRequisicao {
  clientId: string;
  clientSecret?: string;
  refreshToken?: string;
}
