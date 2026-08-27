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

// Status numérico — 0=pendente, 1=aprovada, 2=rejeitada (StatusImagemCandidata no backend).
export const STATUS_IMAGEM_CANDIDATA = { PENDENTE: 0, APROVADA: 1, REJEITADA: 2 } as const;

export interface ImagemCandidata {
  id: number;
  idProduto: number;
  codigo: string;
  nomeProduto: string;
  urlOrigem: string;
  fonte: string;
  scoreIa?: number;
  motivoIa?: string;
  status: number;
  criadoEm: string;
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

export interface VendaPorDia {
  data: string;
  quantidade: number;
  faturamento: number;
}

export interface VendaPorMes {
  ano: number;
  mes: number;
  quantidade: number;
  faturamento: number;
  lucro: number;
}

export interface VendaPorAno {
  ano: number;
  quantidade: number;
  faturamento: number;
  lucro: number;
}

export interface ProdutoAnalise {
  classeAbc?: string;
  faturamentoTotal?: number;
  percentualParticipacao?: number;
  giroDiarioReal?: number;

  faturamentoAnual?: number;
  lucroAnual?: number;
  indiceGiroAnual?: number;
  gmroi?: number;
  capitalParadoCusto?: number;

  estoqueAtual?: number;
  custoUnitario?: number;
  precoVendaAtual?: number;
  dataUltimaVenda?: string;
  dataUltimaEntrada?: string;
  quantidadeUltimaEntrada?: number;
  diasParadoMax?: number;
  statusEstoque?: string;
  custoOportunidadeAcumulado?: number;
  sugestaoPrecoPromo?: number;

  precisaComprar: boolean;
  vendido30d?: number;
  vendido60d?: number;
  vendido90d?: number;
  tendenciaCrescimentoPct?: number;
  giroDiarioProjetado?: number;
  diasCoberturaEstoque?: number;
  sugestaoCompraQtd30d?: number;
  sugestaoCompraQtd60d?: number;
  sugestaoCompraQtd90d?: number;
  valorTotalSugerido30d?: number;
  valorTotalSugerido60d?: number;
  valorTotalSugerido90d?: number;

  vendasPorDia: VendaPorDia[];
  vendasPorMes: VendaPorMes[];
  vendasPorAno: VendaPorAno[];
}

export interface MarketplaceProduto {
  codigo: string; // "google" | "meta" | "site"
  nome: string;
  habilitado: boolean;
  elegivel: boolean;
  motivoNaoElegivel?: string;
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
  idProdutoPai?: number;
  nomeProdutoPai?: string;
  imagens: ProdutoImagem[];
  fornecedores: ProdutoFornecedor[];
  variacoes: ProdutoVariacao[];
  kitComponentes: ProdutoKitComponente[];
  precos: ProdutoPrecoPorLista[];
}
