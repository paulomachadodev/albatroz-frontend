import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Observable, Subscription } from 'rxjs';

export interface OpcaoSelectBusca {
  id: number;
  nome: string;
}

@Component({
  selector: 'app-select-busca',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  templateUrl: './select-busca.component.html',
  host: { class: 'block relative' }
})
export class SelectBuscaComponent {
  valorSelecionado = input<OpcaoSelectBusca | null>(null);
  placeholder = input<string>('Buscar...');
  buscar = input.required<(termo: string) => Observable<OpcaoSelectBusca[]>>();
  selecionado = output<OpcaoSelectBusca | null>();

  resultados = signal<OpcaoSelectBusca[]>([]);
  readonly ptBusca = {
    root: 'relative block w-full',
    pcInputText: { root: 'w-full px-3 py-2 pr-8 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none' },
    overlay: 'mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg',
    listContainer: 'max-h-56 overflow-y-auto',
    list: 'py-1',
    option: 'px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 data-[p-focused=true]:bg-slate-100 dark:data-[p-focused=true]:bg-slate-700',
    emptyMessage: 'px-3 py-2 text-sm text-slate-400',
    loader: 'absolute right-2 top-1/2 -translate-y-1/2 text-slate-400',
    clearIcon: 'absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer'
  };

  private readonly destroyRef = inject(DestroyRef);
  private buscaAtual?: Subscription;

  executarBusca(termo: string) {
    this.buscaAtual?.unsubscribe();
    this.buscaAtual = this.buscar()(termo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: opcoes => this.resultados.set(opcoes),
      error: () => this.resultados.set([])
    });
  }

  selecionarOpcao(opcao: OpcaoSelectBusca) {
    this.buscaAtual?.unsubscribe();
    this.selecionado.emit(opcao);
  }

  limpar() {
    this.buscaAtual?.unsubscribe();
    this.resultados.set([]);
    this.selecionado.emit(null);
  }
}
