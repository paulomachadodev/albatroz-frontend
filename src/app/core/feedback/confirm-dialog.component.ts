import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confirm.estado(); as estado) {
      <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800
                    bg-white dark:bg-slate-900 shadow-lg p-5 animate-[toast-in_.15s_ease-out]">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-amber-500 text-xl shrink-0">warning</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ estado.titulo }}</p>
              @if (estado.mensagem) {
                <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">{{ estado.mensagem }}</p>
              }
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300
                           hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    (click)="confirm.responder(false)">
              {{ estado.textoCancelar ?? 'Cancelar' }}
            </button>
            <button class="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-rose-600
                           hover:bg-rose-700 transition-colors"
                    (click)="confirm.responder(true)">
              {{ estado.textoConfirmar ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes toast-in {
      from { opacity: 0; transform: scale(.97); }
      to   { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ConfirmDialogComponent {
  confirm = inject(ConfirmService);
}
