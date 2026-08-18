export type ProdutoTipo = 'simples' | 'kit' | 'variacao';

export interface ProdutoResumo {
  id: number;
  codigo: string;
  nome: string;
  marca?: string;
  categoria?: string;
  gtin?: string;
  situacao: string;
  tipo: ProdutoTipo;
  quantidadeVariacoes: number;
  quantidadeItensKit: number;
  temImagem: boolean;
  urlImagemPrincipal?: string;
  estoqueAtual: number;
  preco?: number;
}

export interface ProdutoImagem {
  id: number;
  indice: number;
  url: string;
}

export interface ProdutoFornecedor {
  tinyIdFornecedor: number;
  nomeFornecedor: string;
  codigoProdutoFornecedorOriginal?: string;
  codigoProdutoFornecedorCorrigido?: string;
  codigoProdutoFornecedor?: string;
}

export interface ProdutoVariacao {
  id: number;
  codigo: string;
  nome: string;
  preco?: number;
  estoqueAtual: number;
  urlImagemPrincipal?: string;
}

export interface ProdutoKitComponente {
  idComponente: number;
  codigoComponente: string;
  nomeComponente: string;
  quantidade: number;
  estoqueAtual: number;
  urlImagemPrincipal?: string;
}

export interface ProdutoDetalhe {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  idMarca?: number;
  marca?: string;
  idFornecedorContato?: number;
  nomeFornecedorContato?: string;
  categoria?: string;
  gtin?: string;
  situacao: string;
  tipo: ProdutoTipo;
  unidade?: string;
  ncm?: string;
  preco?: number;
  precoPromocional?: number;
  precoCusto?: number;
  pesoBruto?: number;
  pesoLiquido?: number;
  largura?: number;
  altura?: number;
  comprimento?: number;
  quantidadePorCaixa: number | null;
  imagens: ProdutoImagem[];
  fornecedores: ProdutoFornecedor[];
  variacoes: ProdutoVariacao[];
  kitComponentes: ProdutoKitComponente[];
}
