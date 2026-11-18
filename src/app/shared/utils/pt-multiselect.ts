export const PT_MULTISELECT = {
  root: 'relative block w-full',
  label: 'block w-full px-3 py-3 min-[480px]:py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap',
  dropdown: 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400',
  overlay: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg mt-1 z-50 overflow-hidden',
  header: 'p-2 border-b border-slate-100 dark:border-slate-700',
  pcFilter: { root: 'w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm outline-none' },
  list: 'py-1 max-h-64 overflow-y-auto',
  option: 'px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 data-[p-highlight=true]:bg-primary/10 data-[p-highlight=true]:text-primary dark:data-[p-highlight=true]:bg-primary/20 dark:data-[p-highlight=true]:text-white data-[p-highlight=true]:font-semibold data-[p-disabled=true]:opacity-60 data-[p-disabled=true]:cursor-not-allowed',
  pcOptionCheckbox: { root: 'hidden' },
  emptyMessage: 'px-3 py-2 text-sm text-slate-400'
};
