import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { SaudeEstoqueService } from '../../services/saude-estoque.service';
import { BlocoResumoSaudeEstoque, CorteGiroCritico, FaixaAgingEstoqueResumo, SaudeEstoqueResumo } from '../../models/saude-estoque.model';
import { CONFIGS_SAUDE_ESTOQUE, ConfigCategoriaSaudeEstoque } from '../../config/saude-estoque-cards.config';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { GraficoBarrasComponent } from '../../../../shared/components/grafico-barras/grafico-barras.component';

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

interface ArcoGauge {
  x: number;
  y: number;
  innerRadius: number;
  outerRadius: number;
}

interface GaugeChartComDados {
  getDatasetMeta(index: number): { data: ArcoGauge[] };
  data: { ponteiroPercentual?: number };
}

function anguloGauge(valorFracao: number): number {
  return Math.PI - valorFracao * Math.PI;
}

function pontoNoAngulo(arco: ArcoGauge, angulo: number, raio: number): { x: number; y: number } {
  return { x: arco.x + raio * Math.cos(angulo), y: arco.y - raio * Math.sin(angulo) };
}

function desenharTraco(ctx: CanvasRenderingContext2D, arco: ArcoGauge, valorFracao: number) {
  const angulo = anguloGauge(valorFracao);
  const pInterno = pontoNoAngulo(arco, angulo, arco.innerRadius - 2);
  const pExterno = pontoNoAngulo(arco, angulo, arco.outerRadius + 2);

  ctx.beginPath();
  ctx.moveTo(pInterno.x, pInterno.y);
  ctx.lineTo(pExterno.x, pExterno.y);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

const agulhaGaugePlugin = {
  id: 'agulhaGauge',
  afterDatasetsDraw(chart: GaugeChartComDados & { ctx: CanvasRenderingContext2D }) {
    const arco = chart.getDatasetMeta(0).data[0];
    if (!arco) return;

    const ctx = chart.ctx;
    ctx.save();

    desenharTraco(ctx, arco, LIMITE_RISCO_RUPTURA_PCT / ESCALA_MAXIMA_GAUGE_PCT);
    desenharTraco(ctx, arco, LIMITE_EXCESSO_PCT / ESCALA_MAXIMA_GAUGE_PCT);

    const valor = chart.data.ponteiroPercentual ?? 0;
    const angulo = anguloGauge(valor);
    const raioPonta = arco.outerRadius * 0.85;
    const ponta = pontoNoAngulo(arco, angulo, raioPonta);

    ctx.beginPath();
    ctx.moveTo(arco.x, arco.y);
    ctx.lineTo(ponta.x, ponta.y);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(arco.x, arco.y);
    ctx.lineTo(ponta.x, ponta.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0f172a';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(arco.x, arco.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
};

@Component({
  selector: 'app-estoque-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, RouterLink, ChartModule, GraficoBarrasComponent],
  templateUrl: './estoque-dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EstoqueDashboardComponent implements OnInit {
  readonly cards = CARDS;
  readonly opcoesCorteGiroCritico: CorteGiroCritico[] = [20, 40, 60];

  carregando = signal(true);
  resumo = signal<SaudeEstoqueResumo | null>(null);
  corteGiroCritico = signal<CorteGiroCritico>(20);

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
      ponteiroPercentual: percentual / ESCALA_MAXIMA_GAUGE_PCT
    };
  });

  readonly gaugePlugins = [agulhaGaugePlugin];

  readonly ticksGauge = [0, LIMITE_RISCO_RUPTURA_PCT, LIMITE_EXCESSO_PCT, ESCALA_MAXIMA_GAUGE_PCT].map(valor => ({
    valor,
    posicaoPct: ((Math.cos(anguloGauge(valor / ESCALA_MAXIMA_GAUGE_PCT)) + 1) / 2) * 100
  }));

  gaugeOptions = {
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    responsive: true,
    maintainAspectRatio: false
  };

  agingFaixas = computed<FaixaAgingEstoqueResumo[]>(() => this.resumo()?.agingCapitalParado ?? []);

  agingLabels = computed(() => this.agingFaixas().map(f => f.faixa + ' dias'));

  agingDatasets = computed(() => [{
    label: 'Capital parado (custo)',
    data: this.agingFaixas().map(f => f.capitalParadoCusto),
    color: this.agingFaixas().map(f => CORES_AGING[f.faixa] ?? '#94a3b8')
  }]);

  constructor(private saudeEstoqueService: SaudeEstoqueService, private toast: ToastService, private router: Router) {}

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

  aoClicarBarraAging(evento: { index: number }) {
    const faixa = this.agingFaixas()[evento.index]?.faixa;
    if (!faixa) return;
    this.router.navigate(['/estoque/aging', faixa]);
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
}
