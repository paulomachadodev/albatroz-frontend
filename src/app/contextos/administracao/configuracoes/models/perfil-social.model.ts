export interface PerfilSocialEdicao { plataforma: number; nome: string; identificador: string; ativo: boolean; }
export interface PerfilSocial extends PerfilSocialEdicao { id: number; versao: string; criadoEm: string; atualizadoEm: string; autorizacaoPendente: boolean; }
export interface PerfisSociaisLista { habilitado: boolean; itens: PerfilSocial[]; }
export interface MarketingFiltros { redesSociaisHabilitado: boolean; perfis: PerfilSocial[]; redes: string[]; }
export const PLATAFORMAS_SOCIAIS = [{ valor: 1, rotulo: 'Facebook' }, { valor: 2, rotulo: 'Instagram' }, { valor: 3, rotulo: 'TikTok' }, { valor: 4, rotulo: 'WhatsApp' }];
export const FORMATOS_EDITORIAIS = ['Post', 'Carrossel', 'Story', 'Reels', 'Vídeo curto', 'Roteiro'];

export const PERFIL_SELECT_PT = { root: 'relative block w-full', label: 'block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm cursor-pointer min-h-9', dropdown: 'absolute right-3 top-1/2 -translate-y-1/2', overlay: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50', list: 'py-1', option: 'px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' };
