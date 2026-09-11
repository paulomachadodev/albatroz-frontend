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

export interface SaudeEstoque {
  semGiro: ProdutoSaudeEstoque[];
  candidatosParaComprar: ProdutoSaudeEstoque[];
  candidatosInativacao: ProdutoSaudeEstoque[];
  criticos: ProdutoSaudeEstoque[];
}

export type CorteGiroCritico = 20 | 40 | 60;
