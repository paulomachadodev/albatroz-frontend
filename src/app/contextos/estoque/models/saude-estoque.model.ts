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
}

export interface BlocoResumoSaudeEstoque {
  quantidadeSkus: number;
  capitalParadoCusto: number;
}

export interface SaudeEstoqueResumo {
  semGiro: BlocoResumoSaudeEstoque;
  candidatosParaComprar: BlocoResumoSaudeEstoque;
  candidatosInativacao: BlocoResumoSaudeEstoque;
  criticos: BlocoResumoSaudeEstoque;
}

export type CorteGiroCritico = 20 | 40 | 60;

export type CategoriaSaudeEstoque = 'sem-giro' | 'candidatos-parar-comprar' | 'candidatos-inativacao' | 'criticos';
