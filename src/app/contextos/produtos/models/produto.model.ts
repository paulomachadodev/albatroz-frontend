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
  id: number;
  idContato: number;
  nomeFornecedor: string;
  codigoNoFornecedor?: string;
  principal: boolean;
}

export interface ProdutoPrecoPorLista {
  idLista: number;
  nomeLista: string;
  padrao: boolean;
  modoCalculo: 'fixo' | 'percentual_venda' | 'percentual_custo';
  percentual?: number;
  preco?: number;
  precoPromocional?: number;
}

export interface ListaPreco {
  id: number;
  codigo: string;
  nome: string;
  tipo: 'padrao' | 'empresa' | 'escola' | 'site' | 'marketplace' | 'outro';
  padrao: boolean;
  modoCalculo: 'fixo' | 'percentual_venda' | 'percentual_custo';
  percentual?: number;
  ativo: boolean;
}

export interface ProdutoEnriquecimento {
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  seoKeywords?: string;
  seoLinkVideo?: string;
  googleProductCategory?: string;
  googleProductType?: string;
  googleBrand?: string;
  googleGtin?: string;
  condicao?: string;
  disponivelMerchant?: boolean;
  tag: string[];
  sinonimos: string[];
  descricaoEnriquecida?: string;
  descricaoLonga?: string;
  descricaoUso?: string;
  publicoFaixa: string[];
  publicoGenero: string[];
  faixaEtaria?: string;
  cor?: string;
  tamanho?: string;
  material?: string;
  fonteEnriquecimento?: string;
  statusEmbedding?: string;
  enriquecidoEm?: string;
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
  precos: ProdutoPrecoPorLista[];
}
