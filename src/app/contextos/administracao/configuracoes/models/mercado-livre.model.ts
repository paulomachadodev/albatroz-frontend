export interface ConexaoMarketplace { versao: string; idExterno: string; nome: string; situacao: number; expiraEm: string; validadaEm: string; }
export interface MercadoLivreEstado { habilitado: boolean; aplicativoConfigurado: boolean; appId: string | null; versao: string | null; uriRetorno: string; conexao: ConexaoMarketplace | null; }
export interface AplicativoMercadoLivreEdicao { appId: string; clientSecret: string | null; versaoEsperada: string | null; }
export interface IniciarConexaoMarketplace { urlAutorizacao: string; expiraEm: string; }
export interface ConcluirConexaoMarketplace { codigo: string | null; state: string; erroProvedor: string | null; }
export interface TesteConexaoMarketplace { mensagem: string; }
export const SITUACAO_CONEXAO_MARKETPLACE_CONECTADA = 1;
export const SITUACAO_CONEXAO_MARKETPLACE_PRECISA_RECONECTAR = 2;
export const SITUACOES_CONEXAO_MARKETPLACE: Record<number, string> = { 1: 'Conectada', 2: 'Precisa reconectar', 3: 'Revogada', 4: 'Com erro' };
export const URL_AUTORIZACAO_MERCADO_LIVRE = 'https://auth.mercadolivre.com.br/';
