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
  MarcaSubstituida = 3
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
  [StatusItemListaEscolar.MarcaSubstituida]: 'marca substituída'
};
