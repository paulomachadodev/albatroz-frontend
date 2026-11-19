import { PERFIL_SELECT_PT } from '../../contextos/administracao/configuracoes/models/perfil-social.model';

export const PT_SELECT_FILTRO = {
  ...PERFIL_SELECT_PT,
  overlay: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg mt-1 z-50 overflow-hidden',
  header: 'p-2 border-b border-slate-100 dark:border-slate-700',
  pcFilter: { root: 'w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm outline-none' },
  list: 'py-1 max-h-64 overflow-y-auto'
};
