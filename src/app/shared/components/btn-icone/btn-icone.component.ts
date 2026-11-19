import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type VarianteBtnIcone = 'neutro' | 'perigo' | 'primario' | 'sucesso';

const CLASSE_BASE = 'w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const CLASSES_VARIANTE: Record<VarianteBtnIcone, string> = {
  neutro: 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  perigo: 'bg-white/90 dark:bg-slate-900/90 text-red-600 hover:bg-red-50 dark:hover:bg-red-950',
  primario: 'bg-white dark:bg-slate-900 text-primary hover:bg-primary/10',
  sucesso: 'bg-white dark:bg-slate-900 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
};

@Component({
  selector: 'app-btn-icone',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './btn-icone.component.html',
  host: { class: 'inline-block' }
})
export class BtnIconeComponent {
  icone = input.required<string>();
  titulo = input<string>('');
  variante = input<VarianteBtnIcone>('neutro');
  desabilitado = input<boolean>(false);
  link = input<string | readonly unknown[] | null>(null);
  parametros = input<Record<string, string | number | boolean> | null>(null);

  clicar = output<void>();

  readonly classes = computed(() => `${CLASSE_BASE} ${CLASSES_VARIANTE[this.variante()]}`);
}
