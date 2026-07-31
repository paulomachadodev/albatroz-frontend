import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

export interface OpcaoSelectBusca {
  id: number;
  nome: string;
}

@Component({
  selector: 'app-select-busca',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-busca.component.html',
  host: { class: 'block relative' }
})
export class SelectBuscaComponent {
  valorSelecionado = input<OpcaoSelectBusca | null>(null);
  placeholder = input<string>('Buscar...');
  buscar = input.required<(termo: string) => Observable<OpcaoSelectBusca[]>>();
  selecionado = output<OpcaoSelectBusca | null>();

  termo = signal('');
  aberto = signal(false);
  resultados = signal<OpcaoSelectBusca[]>([]);
  buscando = signal(false);

  private debounce?: ReturnType<typeof setTimeout>;

  aoFocar() {
    this.aberto.set(true);
    this.executarBusca(this.termo());
  }

  aoFecharComAtraso() {
    setTimeout(() => this.aberto.set(false), 150);
  }

  aoDigitar(valor: string) {
    this.termo.set(valor);
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.executarBusca(valor), 300);
  }

  private executarBusca(termo: string) {
    this.buscando.set(true);
    this.buscar()(termo).subscribe({
      next: opcoes => { this.resultados.set(opcoes); this.buscando.set(false); },
      error: () => this.buscando.set(false)
    });
  }

  selecionarOpcao(opcao: OpcaoSelectBusca) {
    this.selecionado.emit(opcao);
    this.termo.set('');
    this.aberto.set(false);
  }

  limpar() {
    this.selecionado.emit(null);
    this.termo.set('');
  }
}
