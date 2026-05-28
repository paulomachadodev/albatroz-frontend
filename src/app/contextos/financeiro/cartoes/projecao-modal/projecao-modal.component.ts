import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParcelaProjetada, ParcelaMes } from '../models/despesa-cartao.model';

@Component({
  selector: 'app-projecao-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projecao-modal.component.html'
})
export class ProjecaoModalComponent implements OnInit {
  parcelas = input<ParcelaProjetada[]>([]);
  confirmar = output<ParcelaProjetada[]>();
  cancelar  = output<void>();

  lista = signal<ParcelaProjetada[]>([]);

  ngOnInit() {
    this.lista.set(this.parcelas().map(p => ({
      ...p,
      parcelas: this.gerarMeses(p)
    })));
  }

  private gerarMeses(p: ParcelaProjetada): ParcelaMes[] {
    const hoje = new Date();
    const resultado: ParcelaMes[] = [];
    for (let i = p.parcelaAtual + 1; i <= p.totalParcelas; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + (i - p.parcelaAtual), 1);
      resultado.push({ mes: d.getMonth() + 1, ano: d.getFullYear(), valor: p.valor });
    }
    return resultado;
  }

  confirmarProjecoes() {
    const selecionadas = this.lista().filter(p => p.selecionada);
    this.confirmar.emit(selecionadas);
  }

  formatarMes(mes: number, ano: number): string {
    return new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }

  formatarReais(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
