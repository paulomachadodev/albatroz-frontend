export enum StatusListaEscolar {
  Cotada = 1,
  ReCotada = 2,
  Existente = 3,
  Liberando = 4,
  Liberada = 5
}

export enum StatusItemListaEscolar {
  Encontrado = 1,
  NaoEncontrado = 2,
  MarcaSubstituida = 3,
  SemEstoque = 4
}

export enum MotivoPendenciaItem {
  RecuperadoNaVerificacao = 1,
  TextoIlegivel = 2
}

export const ROTULO_STATUS_LISTA: Record<StatusListaEscolar, string> = {
  [StatusListaEscolar.Cotada]: 'Cotada',
  [StatusListaEscolar.ReCotada]: 'Re-cotada',
  [StatusListaEscolar.Existente]: 'Existente',
  [StatusListaEscolar.Liberando]: 'Liberando',
  [StatusListaEscolar.Liberada]: 'Liberada'
};

export const ROTULO_STATUS_ITEM: Record<StatusItemListaEscolar, string> = {
  [StatusItemListaEscolar.Encontrado]: 'encontrado',
  [StatusItemListaEscolar.NaoEncontrado]: 'não encontrado',
  [StatusItemListaEscolar.MarcaSubstituida]: 'marca substituída',
  [StatusItemListaEscolar.SemEstoque]: 'sem estoque'
};

export const ROTULO_MOTIVO_PENDENCIA: Record<MotivoPendenciaItem, string> = {
  [MotivoPendenciaItem.RecuperadoNaVerificacao]: 'Linha recuperada na verificação — confira descrição e quantidade',
  [MotivoPendenciaItem.TextoIlegivel]: 'Texto ilegível na lista — confira com o documento original'
};
