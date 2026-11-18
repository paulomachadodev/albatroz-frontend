export interface AplicativoMeta { habilitado: boolean; configurado: boolean; appId: string | null; configId: string | null; segredoConfigurado: boolean; versao: string | null; uriRetorno: string; escoposSolicitados: string[]; }
export interface AplicativoMetaEdicao { appId: string; appSecret: string | null; configId: string | null; versaoEsperada: string | null; }
export interface AtivoSocial { id: number; tipo: number; idExterno: string; nome: string; usuario: string | null; idExternoPagina: string | null; selecionado: boolean; }
export interface ConexaoSocial { id: number; versao: string; provedor: number; idExterno: string; nome: string; situacao: number; escoposConcedidos: string[]; escoposAusentes: string[]; expiraEm: string | null; validadaEm: string; criadoEm: string; ativos: AtivoSocial[]; podePublicarFacebook: boolean; podePublicarInstagram: boolean; }
export interface ConexaoMetaEstado { habilitado: boolean; conexao: ConexaoSocial | null; }
export interface IniciarConexao { urlAutorizacao: string; expiraEm: string; }
export interface ConcluirConexao { codigo: string | null; state: string; erroProvedor: string | null; }
export const SITUACOES_CONEXAO: Record<number, string> = { 1: 'Conectada', 2: 'Autorização parcial', 3: 'Expirada', 4: 'Revogada', 5: 'Com erro' };
export const TIPOS_ATIVO: Record<number, string> = { 1: 'Página do Facebook', 2: 'Instagram profissional' };
