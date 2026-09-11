import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { DashboardService, DashboardResumo, GranularidadeDashboard } from './dashboard.service';
import { ToastService } from '../../core/feedback/toast.service';

interface Kpi {
  titulo: string;
  valor:  string;
  delta:  string;
  positivo: boolean;
  icone:  string;
  cor:    string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private dashboardService = inject(DashboardService);
  private toast = inject(ToastService);

  carregando = signal(true);
  resumo = signal<DashboardResumo | null>(null);
  granularidade = signal<GranularidadeDashboard>('mes');
  granularidades: { valor: GranularidadeDashboard; rotulo: string }[] = [
    { valor: 'dia', rotulo: 'Dia' },
    { valor: 'mes', rotulo: 'Mês' },
    { valor: 'ano', rotulo: 'Ano' }
  ];

  saudacao = computed(() => {
    const h = new Date().getHours();
    if (h < 6)  return 'Boa madrugada';
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  primeiroNome = computed(() => this.auth.usuario()?.nome?.split(' ')[0] ?? 'Visitante');

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.dashboardService.obter(this.granularidade()).subscribe({
      next: res => {
        this.resumo.set(res.dados ?? null);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o dashboard.');
        this.carregando.set(false);
      }
    });
  }

  mudarGranularidade(g: GranularidadeDashboard): void {
    if (this.granularidade() === g) return;
    this.granularidade.set(g);
    this.carregar();
  }

  private percentual(atual: number, anterior: number): { texto: string; positivo: boolean } {
    if (anterior <= 0) return { texto: atual > 0 ? '+100%' : '0%', positivo: atual >= 0 };
    const pct = ((atual - anterior) / anterior) * 100;
    const sinal = pct >= 0 ? '+' : '';
    return { texto: `${sinal}${pct.toFixed(1)}%`, positivo: pct >= 0 };
  }

  kpis = computed<Kpi[]>(() => {
    const r = this.resumo();
    if (!r) return [];

    const deltaFaturamento = this.percentual(r.faturamentoMes, r.faturamentoMesAnterior);
    const deltaPedidos = this.percentual(r.pedidosMes, r.pedidosMesAnterior);

    return [
      {
        titulo: 'Faturamento do mês', valor: this.formatarReais(r.faturamentoMes),
        delta: deltaFaturamento.texto, positivo: deltaFaturamento.positivo,
        icone: 'payments', cor: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40'
      },
      {
        titulo: 'Pedidos do mês', valor: r.pedidosMes.toLocaleString('pt-BR'),
        delta: deltaPedidos.texto, positivo: deltaPedidos.positivo,
        icone: 'shopping_cart', cor: 'text-primary bg-primary/10'
      },
      {
        titulo: 'Ticket médio', valor: this.formatarReais(r.ticketMedioMes),
        delta: '', positivo: true,
        icone: 'receipt_long', cor: 'text-violet-600 bg-violet-100 dark:bg-violet-900/40'
      },
      {
        titulo: 'Risco de ruptura', valor: `${r.produtosEstoqueCritico} produto(s)`,
        delta: r.produtosEstoqueCritico > 0 ? 'atenção' : 'ok', positivo: r.produtosEstoqueCritico === 0,
        icone: 'warning', cor: 'text-rose-600 bg-rose-100 dark:bg-rose-900/40'
      }
    ];
  });

  private nomesMeses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  private formatarRotulo(chave: string): string {
    const g = this.granularidade();
    if (g === 'dia') {
      const [, mes, dia] = chave.split('-');
      return `${dia}/${mes}`;
    }
    if (g === 'ano') return chave;
    const [ano, mes] = chave.split('-');
    return `${this.nomesMeses[Number(mes) - 1]}/${ano.slice(2)}`;
  }

  rotuloPeriodoAnterior = computed(() => {
    const g = this.granularidade();
    if (g === 'dia') return '30 dias anteriores';
    if (g === 'ano') return '5 anos anteriores';
    return 'Mesmo período, ano passado';
  });

  chartData = computed(() => {
    const r = this.resumo();
    if (!r) return null;

    const corTexto = this.theme.temaAtual() === 'dark' ? '#94a3b8' : '#64748b';
    const corAnterior = this.theme.temaAtual() === 'dark' ? '#475569' : '#cbd5e1';

    return {
      labels: r.serieAtual.map(p => this.formatarRotulo(p.chave)),
      datasets: [
        {
          label: 'Período atual',
          data: r.serieAtual.map(p => p.valor),
          borderColor: '#1754cf',
          backgroundColor: 'rgba(23, 84, 207, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#1754cf'
        },
        {
          label: this.rotuloPeriodoAnterior(),
          data: r.seriePeriodoAnterior.map(p => p.valor),
          borderColor: corAnterior,
          backgroundColor: 'transparent',
          borderDash: [5, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 0
        }
      ],
      _corTexto: corTexto
    };
  });

  chartOptions = computed(() => {
    const corTexto = this.theme.temaAtual() === 'dark' ? '#94a3b8' : '#64748b';
    const corGrade = this.theme.temaAtual() === 'dark' ? '#1e293b' : '#f1f5f9';

    return {
      maintainAspectRatio: false,
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: corTexto, usePointStyle: true, boxWidth: 8, padding: 16 } },
        tooltip: {
          callbacks: {
            label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
              `${ctx.dataset.label}: ${this.formatarReais(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { ticks: { color: corTexto }, grid: { display: false } },
        y: { ticks: { color: corTexto, callback: (v: number) => this.formatarReaisCompacto(v) }, grid: { color: corGrade } }
      }
    };
  });

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private formatarReaisCompacto(valor: number): string {
    if (valor >= 1000) return `${(valor / 1000).toFixed(0)}k`;
    return String(valor);
  }

  formatarData(valor: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
    return m ? `${m[3]}/${m[2]}` : '-';
  }

  iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);
    const a = partes[0]?.[0] ?? '';
    const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (a + b).toUpperCase();
  }

  corBarraMeta(perc: number): string {
    if (perc >= 100) return 'bg-emerald-500';
    if (perc >= 70) return 'bg-primary';
    return 'bg-amber-500';
  }

  curvaAbcModo = signal<'valor' | 'quantidade'>('valor');

  mudarCurvaAbcModo(modo: 'valor' | 'quantidade'): void {
    this.curvaAbcModo.set(modo);
  }

  curvaAbcItens = computed(() => {
    const c = this.resumo()?.curvaAbc;
    if (!c) return [];
    const modo = this.curvaAbcModo();
    if (modo === 'valor') {
      return [
        { rotulo: 'Curva A', valor: c.skusCurvaAValor, cor: 'bg-emerald-500' },
        { rotulo: 'Curva B', valor: c.skusCurvaBValor, cor: 'bg-amber-500' },
        { rotulo: 'Curva C', valor: c.skusCurvaCValor, cor: 'bg-slate-400' }
      ];
    }
    return [
      { rotulo: 'Curva A', valor: c.skusCurvaAQuantidade, cor: 'bg-emerald-500' },
      { rotulo: 'Curva B', valor: c.skusCurvaBQuantidade, cor: 'bg-amber-500' },
      { rotulo: 'Curva C', valor: c.skusCurvaCQuantidade, cor: 'bg-slate-400' }
    ];
  });

  curvaAbcTotal = computed(() => this.curvaAbcItens().reduce((soma, item) => soma + item.valor, 0));
}
