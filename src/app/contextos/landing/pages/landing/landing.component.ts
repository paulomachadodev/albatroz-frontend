import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoBadgeComponent } from '../../../../shared/components/logo-badge/logo-badge.component';

type Periodo = 'mensal' | 'anual';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  precoMensal: number;
  destaque: boolean;
  recursos: string[];
}

interface Recurso {
  icone: string;
  titulo: string;
  descricao: string;
}

interface Pergunta {
  pergunta: string;
  resposta: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, LogoBadgeComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  readonly periodo = signal<Periodo>('mensal');
  readonly descontoAnual = 0.2;

  readonly recursos: Recurso[] = [
    { icone: 'shopping_cart', titulo: 'Compras inteligentes', descricao: 'Sugestão de quantidade, curva ABC e acompanhamento de pedidos aos fornecedores.' },
    { icone: 'inventory_2', titulo: 'Estoque sob controle', descricao: 'Contagem pelo celular, como um app, com histórico de cada ajuste.' },
    { icone: 'sell', titulo: 'Produtos e preços', descricao: 'Cadastro completo, listas de preço, imagens e descrição padronizada.' },
    { icone: 'receipt_long', titulo: 'Integração com o Tiny', descricao: 'Pedidos, notas e estoque sincronizados automaticamente, com alerta se algo parar.' },
    { icone: 'school', titulo: 'Listas escolares', descricao: 'Cotação de listas escolares a partir da foto ou do arquivo enviado pelo cliente.' },
    { icone: 'smart_toy', titulo: 'Albia, atendente virtual', descricao: 'Atendimento automático no WhatsApp para responder dúvidas e cotar listas.' }
  ];

  readonly planos: Plano[] = [
    {
      id: 'essencial',
      nome: 'Essencial',
      descricao: 'Para quem está organizando a loja.',
      precoMensal: 99,
      destaque: false,
      recursos: ['1 usuário', 'Produtos e estoque', 'Contagem pelo celular', 'Relatórios básicos', 'Suporte por e-mail']
    },
    {
      id: 'profissional',
      nome: 'Profissional',
      descricao: 'Para lojas em crescimento.',
      precoMensal: 199,
      destaque: true,
      recursos: ['Até 5 usuários', 'Tudo do Essencial', 'Compras com curva ABC', 'Integração com o Tiny', 'Listas escolares', 'Suporte prioritário']
    },
    {
      id: 'completo',
      nome: 'Completo',
      descricao: 'Para operações com várias frentes.',
      precoMensal: 399,
      destaque: false,
      recursos: ['Usuários ilimitados', 'Tudo do Profissional', 'Albia no WhatsApp', 'Alertas e monitoramento', 'Atendimento dedicado']
    }
  ];

  readonly perguntas: Pergunta[] = [
    { pergunta: 'Posso testar antes de contratar?', resposta: 'A contratação online ainda não está disponível. Fale com a nossa equipe para conhecer o sistema.' },
    { pergunta: 'Os valores já estão definidos?', resposta: 'Os valores desta página são ilustrativos e podem mudar até o lançamento.' },
    { pergunta: 'Meus dados ficam separados dos de outras empresas?', resposta: 'Sim. Cada empresa tem seus próprios dados, isolados dos demais.' }
  ];

  readonly planosComPreco = computed(() =>
    this.planos.map(plano => ({ ...plano, preco: this.precoNoPeriodo(plano.precoMensal) }))
  );

  definirPeriodo(periodo: Periodo): void {
    this.periodo.set(periodo);
  }

  rolarPara(idSecao: string): void {
    document.getElementById(idSecao)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private precoNoPeriodo(precoMensal: number): number {
    return this.periodo() === 'anual'
      ? Math.round(precoMensal * (1 - this.descontoAnual))
      : precoMensal;
  }
}
