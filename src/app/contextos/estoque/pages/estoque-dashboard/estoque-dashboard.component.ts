import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SaudeEstoqueService } from '../../services/saude-estoque.service';
import { CorteGiroCritico, SaudeEstoqueResumo } from '../../models/saude-estoque.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';

interface CardResumo {
  chave: keyof SaudeEstoqueResumo;
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
  rota: string;
}

const CARDS: CardResumo[] = [
  {
    chave: 'criticos',
    titulo: 'Críticos',
    descricao: 'Curva A com giro alto — não pode faltar, ponto de atenção pra não perder venda por ruptura.',
    icone: 'priority_high',
    cor: 'text-rose-600 bg-rose-100 dark:bg-rose-900/40',
    rota: '/estoque/criticos'
  },
  {
    chave: 'candidatosParaComprar',
    titulo: 'Candidatos a não repor',
    descricao: 'Sem venda há 90+ dias, mas ainda tem estoque — deixar vender o que tem antes de comprar mais.',
    icone: 'pause_circle',
    cor: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40',
    rota: '/estoque/candidatos-parar-comprar'
  },
  {
    chave: 'semGiro',
    titulo: 'Sem giro',
    descricao: 'Sem venda há 90+ dias, com ou sem estoque.',
    icone: 'trending_down',
    cor: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
    rota: '/estoque/sem-giro'
  },
  {
    chave: 'candidatosInativacao',
    titulo: 'Candidatos a inativação',
    descricao: 'Sem venda e sem estoque há 12 meses, ou nunca vendeu desde o cadastro há 12+ meses.',
    icone: 'delete_sweep',
    cor: 'text-violet-600 bg-violet-100 dark:bg-violet-900/40',
    rota: '/estoque/candidatos-inativacao'
  }
];

@Component({
  selector: 'app-estoque-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, RouterLink],
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

  bloco(chave: keyof SaudeEstoqueResumo) {
    return this.resumo()?.[chave] ?? { quantidadeSkus: 0, capitalParadoCusto: 0 };
  }

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
