export const PT_TOGGLE_SELECIONAR = {
  root: 'inline-flex items-center cursor-pointer align-middle',
  input: 'absolute opacity-0 w-0 h-0',
  slider: ({ instance }: { instance: { checked(): boolean } }) =>
    'relative inline-block w-9 h-5 rounded-full transition-colors ' + (instance.checked() ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'),
  handle: ({ instance }: { instance: { checked(): boolean } }) =>
    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ' + (instance.checked() ? 'translate-x-4' : '')
};
