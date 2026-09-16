export interface ProdutoPrioridadeContagem {
  idProduto: number;
  codigo: string;
  gtin: string | null;
  nome: string;
  marca: string | null;
  estoqueAtual: number;
  classeAbc: string | null;
  diasSemVenda: number | null;
  ultimaContagemEm: string | null;
}

export interface FocoParadosStatus {
  ativo: boolean;
  totalRestante: number;
}

export interface FiltroPrioridadeContagem {
  idMarca?: number;
  categoriaRaiz?: string;
  situacao?: string;
  comEstoque?: boolean;
  curvaAbc?: string;
}

export interface CategoriaArvoreNo {
  nome: string;
  idCategoria: number | null;
  categoriaRaiz: string;
  filhos: CategoriaArvoreNo[];
}

export interface OrdenacaoPrioridadeContagem {
  campo: string;
  direcao: 'asc' | 'desc';
}

export interface ItemImportacaoContagem {
  codigo: string;
  quantidadeContada: number;
  quantidadeSistemaExportacao: number | null;
}

export interface ItemPreviewContagem {
  idProduto: number | null;
  codigo: string;
  nome: string | null;
  quantidadeExportacao: number | null;
  quantidadeAtual: number | null;
  quantidadeContada: number;
  diferencaReal: number | null;
  novoSaldoEstimado: number | null;
  percentualDiferenca: number | null;
  usouSaldoAtualComoBase: boolean;
  requerAtencao: boolean;
  erro: string | null;
}

export interface PreviewContagem {
  itens: ItemPreviewContagem[];
  totalValidos: number;
  totalComErro: number;
}

export interface ItemConfirmarContagem {
  idProduto: number;
  quantidadeContada: number;
  quantidadeSistemaExportacao: number | null;
}

export type ModoContagemSessao = 'prioridade' | 'categoria' | 'marca' | 'selecao';
export type StatusContagemSessao = 'aberta' | 'emRevisao' | 'efetivada' | 'desfeita' | 'cancelada';

export interface IniciarContagemSessaoRequisicao {
  modo: ModoContagemSessao;
  categoriaRaiz?: string | null;
  idMarca?: number | null;
  idsProduto?: number[];
}

export interface BiparItemContagemSessaoRequisicao {
  idProduto: number;
  codigo: string;
  quantidadeContada: number;
}

export interface ContagemSessaoResumo {
  id: number;
  modo: ModoContagemSessao;
  categoriaRaiz: string | null;
  marcaNome: string | null;
  status: StatusContagemSessao;
  qtdItens: number;
  metaDiaAlvo: number;
  iniciadaEm: string;
  finalizadaEm: string | null;
  efetivadaEm: string | null;
  nomeUsuario: string | null;
}

export interface ContagemSessaoItem {
  idProduto: number;
  codigo: string;
  nome: string;
  quantidadeContada: number;
  quantidadeSistemaMomento: number | null;
}

export interface ContagemSessaoDetalhe {
  sessao: ContagemSessaoResumo;
  itens: ContagemSessaoItem[];
}

export interface ProdutoPendenteSessao {
  idProduto: number;
  codigo: string;
  gtin: string | null;
  nome: string;
  estoqueAtual: number;
}

export interface PendentesSessao {
  metaDiaAlvo: number;
  contadosHoje: number;
  totalPendentes: number;
  produtos: ProdutoPendenteSessao[];
}

export interface EfetivarContagemSessaoResposta {
  produtosAplicados: number;
}

export interface DesfazerContagemSessaoResposta {
  estornados: number;
  bloqueadosPorDivergencia: number;
}
