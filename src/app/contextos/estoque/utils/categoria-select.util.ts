import { CategoriaArvoreNo } from '../models/contagem-estoque.model';

export interface GrupoCategoriaSelect {
  label: string;
  items: { valor: string; rotulo: string }[];
}

export const PT_SELECT_CATEGORIA = {
  root: 'relative w-full',
  label: 'w-full px-3 py-3 min-[480px]:py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap',
  dropdown: 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400',
  overlay: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg mt-1 z-50 overflow-hidden',
  header: 'p-2 border-b border-slate-100 dark:border-slate-700',
  pcFilter: { root: 'w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm outline-none' },
  list: 'py-1 max-h-64 overflow-y-auto',
  optionGroup: 'px-3 py-1.5 text-xs font-bold uppercase text-slate-400',
  option: 'px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700',
  emptyMessage: 'px-3 py-2 text-sm text-slate-400'
};

function achatarNo(no: CategoriaArvoreNo, opcoes: { valor: string; rotulo: string }[]) {
  opcoes.push({ valor: no.categoriaRaiz, rotulo: no.categoriaRaiz.split(' -> ').join(' > ') });
  no.filhos.forEach(filho => achatarNo(filho, opcoes));
}

export function montarGruposCategoriaSelect(raizes: CategoriaArvoreNo[]): GrupoCategoriaSelect[] {
  return raizes.map(raiz => {
    const opcoes: { valor: string; rotulo: string }[] = [];
    achatarNo(raiz, opcoes);
    return { label: raiz.nome, items: opcoes };
  });
}
