import { PecaResumo } from './peca.model';

export interface DataMarketing { chave: string; nome: string; categoria: number; inicio: string; fim: string | null; relevancia: number; dica: string; }
export interface Calendario { habilitado: boolean; inicio: string; fim: string; datas: DataMarketing[]; pecas: PecaResumo[]; }
export const CATEGORIAS_DATA: Record<number, string> = { 1: 'Comemorativa', 2: 'Comércio', 3: 'Escolar', 4: 'Feriado nacional' };
export const CLASSE_CATEGORIA_DATA: Record<number, string> = {
  1: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
  2: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  3: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  4: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
};
