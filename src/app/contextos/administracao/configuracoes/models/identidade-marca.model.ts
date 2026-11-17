export interface IdentidadeMarcaCores {
  principal: string;
  secundaria: string;
  fundo: string;
  texto: string;
}

export interface IdentidadeMarcaEdicao {
  nomeDivulgacao: string;
  segmentos: string[];
  propostaValor: string;
  ofertas: string;
  publicos: string[];
  regioes: string[];
  idioma: string;
  fusoHorario: string;
  tomVoz: string;
  restricoes: string;
  cores: IdentidadeMarcaCores;
  fontes: string;
}

export interface IdentidadeMarcaRequisicao extends IdentidadeMarcaEdicao {
  versaoEsperada: string | null;
}

export interface IdentidadeMarca extends IdentidadeMarcaEdicao {
  habilitado: boolean;
  configurada: boolean;
  versao: string | null;
  atualizadoEm: string | null;
  logoUrl: string | null;
  segmentoCadastro: string | null;
}
