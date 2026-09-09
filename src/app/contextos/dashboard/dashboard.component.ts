import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService, DashboardResumo } from './dashboard.service';
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
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private toast = inject(ToastService);

  carregando = signal(true);
  resumo = signal<DashboardResumo | null>(null);

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
    this.dashboardService.obter().subscribe({
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
        titulo: 'Faturamento do mês', valor: this.formatarReaisCompacto(r.faturamentoMes),
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

  serieRotulos = computed(() => (this.resumo()?.faturamentoPorMes ?? []).map(f => `${this.nomesMeses[f.mes - 1]}/${String(f.ano).slice(2)}`));
  serieValores = computed(() => (this.resumo()?.faturamentoPorMes ?? []).map(f => f.faturamento));
  serieMax = computed(() => Math.max(1, ...this.serieValores()));

  pathLinha = computed(() => {
    const valores = this.serieValores();
    if (valores.length < 2) return { linha: '', area: '', pontos: [] as (readonly [number, number])[] };

    const w = 600, h = 180, pad = 20;
    const max = this.serieMax();
    const step = (w - pad * 2) / (valores.length - 1);
    const pontos = valores.map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v / max) * (h - pad * 2));
      return [x, y] as const;
    });
    const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    const area  = `${linha} L ${pontos[pontos.length-1][0]} ${h-pad} L ${pontos[0][0]} ${h-pad} Z`;
    return { linha, area, pontos };
  });

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarReaisCompacto(valor?: number): string {
    if (!valor) return 'R$0';
    if (valor >= 1000) return `R$${(valor / 1000).toFixed(1)}k`;
    return `R$${Math.round(valor)}`;
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
}
