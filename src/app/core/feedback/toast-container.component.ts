import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, TipoToast } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      @for (t of toast.toasts(); track t.id) {
        <div class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg
                    bg-white dark:bg-slate-900 animate-[toast-in_.2s_ease-out]"
             [class]="borda(t.tipo)">
          <span class="material-symbols-outlined text-base shrink-0 mt-0.5" [class]="cor(t.tipo)">
            {{ icone(t.tipo) }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ t.titulo }}</p>
            @if (t.mensagem) {
              <p class="text-sm text-slate-600 dark:text-slate-400 break-words">{{ t.mensagem }}</p>
            }
          </div>
          <button class="size-6 flex items-center justify-center rounded-lg text-slate-400
                         hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
                  (click)="toast.remover(t.id)">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(1rem); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastContainerComponent {
  toast = inject(ToastService);

  icone(tipo: TipoToast): string {
    return { sucesso: 'check_circle', erro: 'error', aviso: 'warning', info: 'info' }[tipo];
  }

  cor(tipo: TipoToast): string {
    return {
      sucesso: 'text-emerald-500',
      erro:    'text-rose-500',
      aviso:   'text-amber-500',
      info:    'text-primary'
    }[tipo];
  }

  borda(tipo: TipoToast): string {
    return {
      sucesso: 'border-emerald-200 dark:border-emerald-800',
      erro:    'border-rose-200 dark:border-rose-800',
      aviso:   'border-amber-200 dark:border-amber-800',
      info:    'border-slate-200 dark:border-slate-800'
    }[tipo];
  }
}
