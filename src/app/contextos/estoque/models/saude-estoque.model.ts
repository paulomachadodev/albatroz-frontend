export interface ProdutoSaudeEstoque {
  idProduto: number;
  codigo: string;
  nome: string;
  marca: string | null;
  estoqueAtual: number;
  precoCusto: number | null;
  dataUltimaVenda: string | null;
  motivo: string | null;
  pctDiasComVenda: number | null;
  diasEstoque: number | null;
  metaDiasEstoque: number;
  diasSemEstoque: number | null;
}

export interface BlocoResumoSaudeEstoque {
  quantidadeSkus: number;
  capitalParadoCusto: number;
}

export type ClassificacaoGaugeSaudeEstoque = 'risco_ruptura' | 'saudavel' | 'excesso';

export interface GaugeSaudeEstoque {
  percentualCoberturaMeta: number;
  classificacao: ClassificacaoGaugeSaudeEstoque;
}

export type FaixaAgingEstoque = '0-30' | '30-60' | '60-90' | '90-180' | '180+';

export interface FaixaAgingEstoqueResumo {
  faixa: FaixaAgingEstoque;
  capitalParadoCusto: number;
}

export interface SaudeEstoqueResumo {
  semGiro: BlocoResumoSaudeEstoque;
  candidatosParaComprar: BlocoResumoSaudeEstoque;
  candidatosInativacao: BlocoResumoSaudeEstoque;
  criticos: BlocoResumoSaudeEstoque;
  emRuptura: BlocoResumoSaudeEstoque;
  skusParadosTotal: number;
  capitalParadoTotal: number;
  gaugeSaude: GaugeSaudeEstoque;
  agingCapitalParado: FaixaAgingEstoqueResumo[];
}

export type CorteGiroCritico = 20 | 40 | 60;
export type JanelaRuptura = 90 | 120 | 180;

export type CategoriaSaudeEstoque =
  | 'sem-giro'
  | 'candidatos-parar-comprar'
  | 'candidatos-inativacao'
  | 'criticos'
  | 'em-ruptura';

export interface OrdenacaoSaudeEstoque {
  campo: string;
  direcao: 'asc' | 'desc';
}
