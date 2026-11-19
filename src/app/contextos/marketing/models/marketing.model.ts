export interface LinhaEditorial {
  nome: string;
  objetivo: string;
  exemplos: string;
  restricoes: string;
  formatos: string[];
  participacao: number;
  ativa: boolean;
}

export interface EstrategiaEditorialEdicao {
  objetivo: number;
  redes: string[];
  formatos: string[];
  pecasPorSemana: number;
  limiteTexto: number;
  assuntosProibidos: string[];
  linhas: LinhaEditorial[];
}

export interface EstrategiaEditorialRequisicao extends EstrategiaEditorialEdicao {
  versaoEsperada: string | null;
}

export interface EstrategiaEditorial extends EstrategiaEditorialEdicao {
  habilitado: boolean;
  configurada: boolean;
  versao: string | null;
  atualizadoEm: string | null;
}

export const OBJETIVOS_MARKETING = [
  { valor: 1, rotulo: 'Reconhecimento da marca' },
  { valor: 2, rotulo: 'Engajamento' },
  { valor: 3, rotulo: 'Tráfego' },
  { valor: 4, rotulo: 'Oportunidades de negócio' }
] as const;

export const SUGESTOES_LINHAS: LinhaEditorial[] = [
  { nome: 'Produtos e serviços', objetivo: 'Apresentar o que a empresa oferece.', exemplos: '', restricoes: '', formatos: [], participacao: 30, ativa: true },
  { nome: 'Dicas e educação', objetivo: 'Ensinar algo útil ao público.', exemplos: '', restricoes: '', formatos: [], participacao: 25, ativa: true },
  { nome: 'Inspiração e motivação', objetivo: 'Conectar a marca ao público com conteúdo leve.', exemplos: '', restricoes: '', formatos: [], participacao: 15, ativa: true },
  { nome: 'Bastidores e comunidade', objetivo: 'Mostrar a equipe, o dia a dia e os clientes.', exemplos: '', restricoes: '', formatos: [], participacao: 15, ativa: true },
  { nome: 'Notícias do setor', objetivo: 'Comentar novidades com fonte verificada.', exemplos: '', restricoes: '', formatos: [], participacao: 10, ativa: true },
  { nome: 'Datas relevantes', objetivo: 'Aproveitar datas e campanhas sazonais.', exemplos: '', restricoes: '', formatos: [], participacao: 5, ativa: true }
];

export interface BriefingEdicao {
  objetivo: string;
  publico: string;
  linha: string;
  assunto: string;
  produtoServico: string;
  oferta: string;
  formato: string;
  rede: string;
  referencias: string;
  prazo: string | null;
}

export interface ProdutoBriefing { id: number; codigo: string; nome: string; }

export interface BriefingAtualizacao extends BriefingEdicao {
  status: number;
  versaoEsperada: string;
  produtoIds: number[];
}

export interface Briefing extends BriefingEdicao {
  produtos: ProdutoBriefing[];
  id: number;
  status: number;
  versao: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface BriefingFiltro {
  texto?: string;
  rede?: string;
  status?: number;
  ordenarPor?: string;
  direcao?: string;
}

export const STATUS_BRIEFING = [
  { valor: 1, rotulo: 'Rascunho' },
  { valor: 2, rotulo: 'Confirmado' },
  { valor: 3, rotulo: 'Arquivado' }
] as const;
