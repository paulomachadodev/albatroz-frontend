export interface AgenteConfig {
  ativa: boolean;
  pausaHumanoMin: number;
  esperaRespostaSeg: number;
  desligadaEm: string | null;
  versao: string;
}

export interface AgenteConfigRequisicao {
  ativa: boolean;
  pausaHumanoMin: number;
  esperaRespostaSeg: number;
  versaoEsperada: string;
}

export interface ContatoBloqueado {
  id: number;
  identificador: string;
  nome: string;
  motivo: string | null;
  criadoEm: string;
}

export interface ContatoBloqueadoRequisicao {
  identificador: string;
  nome: string;
  motivo: string | null;
}

export const ESPERA_RESPOSTA_PADRAO_SEG = 30;
export const ESPERA_RESPOSTA_MAXIMA_SEG = 300;
export const PAUSA_HUMANO_PADRAO_MIN = 60;
export const PAUSA_HUMANO_MAXIMA_MIN = 1440;

export function descreverEspera(segundos: number): string {
  if (segundos <= 0) return 'A Albia responde assim que a mensagem chega.';
  if (segundos < 60) return `A Albia espera ${segundos} segundos depois da última mensagem para juntar o que o cliente escrever em sequência.`;
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  const tempo = resto === 0 ? `${minutos} min` : `${minutos} min e ${resto} s`;
  return `A Albia espera ${tempo} depois da última mensagem para juntar o que o cliente escrever em sequência.`;
}
