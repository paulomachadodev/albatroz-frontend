import { Component, input, output, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { OpcaoSelectBusca } from '../select-busca/select-busca.component';

export type { OpcaoSelectBusca };

@Component({
  selector: 'app-select-busca-multi',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './select-busca-multi.component.html',
  host: { class: 'block relative' }
})
export class SelectBuscaMultiComponent {
  valoresSelecionados = input<OpcaoSelectBusca[]>([]);
  placeholder = input<string>('Buscar...');
  buscar = input.required<(termo: string) => Observable<OpcaoSelectBusca[]>>();
  selecionadosChange = output<OpcaoSelectBusca[]>();

  termo = signal('');
  aberto = signal(false);
  resultados = signal<OpcaoSelectBusca[]>([]);
  buscando = signal(false);

  private debounce?: ReturnType<typeof setTimeout>;

  aoFocar() {
    this.aberto.set(true);
    if (this.termo().trim().length > 0) this.executarBusca(this.termo());
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

  estaSelecionado(opcao: OpcaoSelectBusca): boolean {
    return this.valoresSelecionados().some(v => v.id === opcao.id);
  }

  alternar(opcao: OpcaoSelectBusca) {
    const atuais = this.valoresSelecionados();
    const novo = this.estaSelecionado(opcao)
      ? atuais.filter(v => v.id !== opcao.id)
      : [...atuais, opcao];
    this.selecionadosChange.emit(novo);
    this.termo.set('');
    this.resultados.set([]);
  }

  remover(opcao: OpcaoSelectBusca, evento: Event) {
    evento.stopPropagation();
    this.selecionadosChange.emit(this.valoresSelecionados().filter(v => v.id !== opcao.id));
  }
}
