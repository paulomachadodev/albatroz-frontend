import { CategoriaSaudeEstoque } from '../models/saude-estoque.model';

export interface ConfigCategoriaSaudeEstoque {
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
  rota: string;
  permiteSelecao: boolean;
}

export const CONFIGS_SAUDE_ESTOQUE: Record<CategoriaSaudeEstoque, ConfigCategoriaSaudeEstoque> = {
  criticos: {
    titulo: 'Críticos',
    descricao: 'Curva A com giro alto — não pode faltar, ponto de atenção pra não perder venda por ruptura.',
    icone: 'priority_high',
    cor: 'text-rose-600 bg-rose-100 dark:bg-rose-900/40',
    rota: '/estoque/criticos',
    permiteSelecao: false
  },
  'em-ruptura': {
    titulo: 'Em ruptura',
    descricao: 'Zerou o estoque de um item que ainda tinha venda ativa e não foi reposto na janela configurada.',
    icone: 'production_quantity_limits',
    cor: 'text-red-700 bg-red-100 dark:bg-red-900/40',
    rota: '/estoque/em-ruptura',
    permiteSelecao: false
  },
  'candidatos-parar-comprar': {
    titulo: 'Candidatos a não repor',
    descricao: 'Sem venda há 90+ dias, mas ainda tem estoque — deixar vender o que tem antes de comprar mais.',
    icone: 'pause_circle',
    cor: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40',
    rota: '/estoque/candidatos-parar-comprar',
    permiteSelecao: true
  },
  'sem-giro': {
    titulo: 'Sem giro',
    descricao: 'Sem venda há 90+ dias, com estoque disponível.',
    icone: 'trending_down',
    cor: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
    rota: '/estoque/sem-giro',
    permiteSelecao: true
  },
  'candidatos-inativacao': {
    titulo: 'Candidatos a inativação',
    descricao: 'Sem venda e sem estoque há 12 meses, ou nunca vendeu desde o cadastro há 12+ meses.',
    icone: 'delete_sweep',
    cor: 'text-violet-600 bg-violet-100 dark:bg-violet-900/40',
    rota: '/estoque/candidatos-inativacao',
    permiteSelecao: true
  }
};
