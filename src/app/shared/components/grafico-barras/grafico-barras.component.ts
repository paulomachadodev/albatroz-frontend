import { Component, computed, effect, inject, input } from '@angular/core';

import { ChartModule } from 'primeng/chart';
import { ThemeService } from '../../../core/theme/theme.service';

export interface DatasetGraficoBarras {
  label: string;
  data: number[];
  color: string;
}

@Component({
  selector: 'app-grafico-barras',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './grafico-barras.component.html'
})
export class GraficoBarrasComponent {
  private theme = inject(ThemeService);

  labels = input<string[]>([]);
  datasets = input<DatasetGraficoBarras[]>([]);
  stacked = input<boolean>(false);
  formatoValor = input<'numero' | 'reais'>('numero');
  altura = input<string>('192px');

  constructor() {
    effect(() => this.theme.temaAtual());
  }

  private formatar(valor: number): string {
    if (this.formatoValor() === 'reais') {
      if (Math.abs(valor) >= 1000) return `R$${(valor / 1000).toFixed(1)}k`;
      return `R$${Math.round(valor)}`;
    }
    return valor.toLocaleString('pt-BR');
  }

  chartData = computed(() => ({
    labels: this.labels(),
    datasets: this.datasets().map(d => ({
      label: d.label,
      data: d.data,
      backgroundColor: d.color,
      hoverBackgroundColor: d.color,
      borderRadius: 4,
      maxBarThickness: 32
    }))
  }));

  chartOptions = computed(() => {
    const escuro = this.theme.temaAtual() === 'dark';
    const corTexto = escuro ? '#cbd5e1' : '#475569';
    const corGrade = escuro ? '#334155' : '#e2e8f0';
    const mostrarLegenda = this.datasets().length > 1;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: 'index' as const, intersect: false },
      hover: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          display: mostrarLegenda,
          labels: { color: corTexto, usePointStyle: true, boxWidth: 8 }
        },
        tooltip: {
          callbacks: {
            label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
              `${ctx.dataset.label ?? ''}: ${this.formatar(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          stacked: this.stacked(),
          ticks: { color: corTexto, font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          stacked: this.stacked(),
          ticks: {
            color: corTexto,
            font: { size: 10 },
            callback: (valor: number) => this.formatar(valor)
          },
          grid: { color: corGrade }
        }
      }
    };
  });
}
