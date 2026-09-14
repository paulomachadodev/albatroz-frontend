import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { SaudeEstoqueService } from '../../services/saude-estoque.service';
import { BlocoResumoSaudeEstoque, CorteGiroCritico, FaixaAgingEstoqueResumo, SaudeEstoqueResumo } from '../../models/saude-estoque.model';
import { CONFIGS_SAUDE_ESTOQUE, ConfigCategoriaSaudeEstoque } from '../../config/saude-estoque-cards.config';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';

type ChaveBlocoSaudeEstoque = 'semGiro' | 'candidatosParaComprar' | 'candidatosInativacao' | 'criticos' | 'emRuptura';

interface CardResumo extends ConfigCategoriaSaudeEstoque {
  chave: ChaveBlocoSaudeEstoque;
}

const CARDS: CardResumo[] = [
  { chave: 'criticos', ...CONFIGS_SAUDE_ESTOQUE['criticos'] },
  { chave: 'emRuptura', ...CONFIGS_SAUDE_ESTOQUE['em-ruptura'] },
  { chave: 'candidatosParaComprar', ...CONFIGS_SAUDE_ESTOQUE['candidatos-parar-comprar'] },
  { chave: 'semGiro', ...CONFIGS_SAUDE_ESTOQUE['sem-giro'] },
  { chave: 'candidatosInativacao', ...CONFIGS_SAUDE_ESTOQUE['candidatos-inativacao'] }
];

const LIMITE_RISCO_RUPTURA_PCT = 70;
const LIMITE_EXCESSO_PCT = 130;
const ESCALA_MAXIMA_GAUGE_PCT = 200;

const CORES_AGING: Record<string, string> = {
  '0-30': '#10b981',
  '30-60': '#84cc16',
  '60-90': '#f59e0b',
  '90-180': '#f97316',
  '180+': '#e11d48'
};

@Component({
  selector: 'app-estoque-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, RouterLink, ChartModule],
  templateUrl: './estoque-dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EstoqueDashboardComponent implements OnInit {
  readonly cards = CARDS;
  readonly opcoesCorteGiroCritico: CorteGiroCritico[] = [20, 40, 60];

  carregando = signal(true);
  resumo = signal<SaudeEstoqueResumo | null>(null);
  corteGiroCritico = signal<CorteGiroCritico>(20);

  capitalParadoTotal = computed(() => this.resumo()?.capitalParadoTotal ?? 0);

  gaugeData = computed(() => {
    const percentual = Math.min(this.resumo()?.gaugeSaude?.percentualCoberturaMeta ?? 0, ESCALA_MAXIMA_GAUGE_PCT);
    return {
      labels: ['Risco de ruptura', 'Saudável', 'Excesso'],
      datasets: [{
        data: [
          LIMITE_RISCO_RUPTURA_PCT,
          LIMITE_EXCESSO_PCT - LIMITE_RISCO_RUPTURA_PCT,
          ESCALA_MAXIMA_GAUGE_PCT - LIMITE_EXCESSO_PCT
        ],
        backgroundColor: ['#ef4444', '#10b981', '#f59e0b'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
        cutout: '75%'
      }],
      ponteiroPercentual: Math.min(percentual / ESCALA_MAXIMA_GAUGE_PCT, 1)
    };
  });

  gaugeOptions = {
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    responsive: true,
    maintainAspectRatio: false
  };

  agingChartData = computed(() => {
    const faixas: FaixaAgingEstoqueResumo[] = this.resumo()?.agingCapitalParado ?? [];
    return {
      labels: faixas.map(f => f.faixa + ' dias'),
      datasets: [{
        label: 'Capital parado (custo)',
        data: faixas.map(f => f.capitalParadoCusto),
        backgroundColor: faixas.map(f => CORES_AGING[f.faixa] ?? '#94a3b8'),
        borderRadius: 6
      }]
    };
  });

  agingChartOptions = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { callback: (v: number) => this.formatarReaisCompacto(v) } }
    }
  };

  constructor(private saudeEstoqueService: SaudeEstoqueService, private toast: ToastService) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.saudeEstoqueService.obterResumo(this.corteGiroCritico()).subscribe({
      next: res => {
        this.resumo.set(res.dados ?? null);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o resumo de saúde de estoque.');
        this.carregando.set(false);
      }
    });
  }

  aoMudarCorte(corte: CorteGiroCritico) {
    if (this.corteGiroCritico() === corte) return;
    this.corteGiroCritico.set(corte);
    this.carregar();
  }

  bloco(chave: ChaveBlocoSaudeEstoque): BlocoResumoSaudeEstoque {
    return this.resumo()?.[chave] ?? { quantidadeSkus: 0, capitalParadoCusto: 0 };
  }

  rotuloGauge(): string {
    const classificacao = this.resumo()?.gaugeSaude?.classificacao;
    if (classificacao === 'risco_ruptura') return 'Estoque abaixo do saudável — risco de ruptura';
    if (classificacao === 'excesso') return 'Excesso de estoque — capital parado acima do ideal';
    return 'Estoque saudável';
  }

  corGauge(): string {
    const classificacao = this.resumo()?.gaugeSaude?.classificacao;
    if (classificacao === 'risco_ruptura') return 'text-rose-600';
    if (classificacao === 'excesso') return 'text-amber-600';
    return 'text-emerald-600';
  }

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarReaisCompacto(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });
  }
}
