import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

interface Kpi {
  titulo: string;
  valor:  string;
  delta:  string;
  positivo: boolean;
  icone:  string;
  cor:    string;
}

interface Atividade {
  quem:    string;
  acao:    string;
  alvo:    string;
  quando:  string;
  tipo:    'criou' | 'editou' | 'aprovou' | 'cancelou';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private auth = inject(AuthService);

  saudacao = computed(() => {
    const h = new Date().getHours();
    if (h < 6)  return 'Boa madrugada';
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  primeiroNome = computed(() => this.auth.usuario()?.nome?.split(' ')[0] ?? 'Visitante');

  kpis: Kpi[] = [
    { titulo: 'Receita do mês',     valor: 'R$ 284.530', delta: '+12,4%',   positivo: true,  icone: 'dollar', cor: 'from-emerald-500 to-teal-600' },
    { titulo: 'Cotações abertas',   valor: '47',         delta: '+8 novas', positivo: true,  icone: 'file',   cor: 'from-sky-500 to-blue-600' },
    { titulo: 'Produtos ativos',    valor: '1.284',      delta: '+23',      positivo: true,  icone: 'box',    cor: 'from-violet-500 to-purple-600' },
    { titulo: 'Estoque crítico',    valor: '12 itens',   delta: '−3',       positivo: false, icone: 'alert',  cor: 'from-rose-500 to-orange-500' }
  ];

  // Vendas últimos 12 meses (mock)
  serieMeses  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  serieValores = [142, 168, 155, 198, 212, 245, 232, 268, 281, 295, 312, 285];
  serieMax    = computed(() => Math.max(...this.serieValores));

  pathLinha = computed(() => {
    const w = 600, h = 180, pad = 20;
    const max = this.serieMax();
    const step = (w - pad * 2) / (this.serieValores.length - 1);
    const pontos = this.serieValores.map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v / max) * (h - pad * 2));
      return [x, y] as const;
    });
    const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    const area  = `${linha} L ${pontos[pontos.length-1][0]} ${h-pad} L ${pontos[0][0]} ${h-pad} Z`;
    return { linha, area, pontos };
  });

  atividades: Atividade[] = [
    { quem: 'Maria Souza',  acao: 'aprovou',  alvo: 'Cotação #1248', quando: 'há 3 min',  tipo: 'aprovou' },
    { quem: 'João Lima',    acao: 'criou',    alvo: 'Produto "Cabo HDMI 2.1"', quando: 'há 12 min', tipo: 'criou' },
    { quem: 'Ana Pereira',  acao: 'editou',   alvo: 'Estoque "Filial Centro"', quando: 'há 27 min', tipo: 'editou' },
    { quem: 'Carlos Reis',  acao: 'cancelou', alvo: 'Cotação #1247', quando: 'há 1 h',   tipo: 'cancelou' },
    { quem: 'Paulo Machado',acao: 'criou',    alvo: 'Perfil "Vendedor Sênior"', quando: 'há 2 h', tipo: 'criou' }
  ];

  corTipo(tipo: Atividade['tipo']): string {
    return ({
      criou:    'bg-sky-100 text-sky-700',
      editou:   'bg-amber-100 text-amber-700',
      aprovou:  'bg-emerald-100 text-emerald-700',
      cancelou: 'bg-rose-100 text-rose-700'
    } as const)[tipo];
  }
}
