export interface Paginacao<T> {
  dados: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
}

export interface ParametrosPaginacao {
  pagina: number;
  tamanho: number;
  ordenacao?: string;
  direcao?: 'asc' | 'desc';
}
