export interface ResumoContaInstagram { usuario: string | null; seguidores: number | null; totalMidias: number | null; }
export interface PostInstagram {
  id: string; tipo: string; publicadoEm: string; legenda: string | null; link: string | null; curtidas: number; comentarios: number;
  alcance: number | null; salvamentos: number | null; compartilhamentos: number | null; interacoes: number;
}
export interface HorarioSugerido { diaSemana: number; horaInicio: number; horaFim: number; interacaoMedia: number; amostra: number; confianca: string; }
export interface DesempenhoFormato { formato: string; posts: number; interacaoMedia: number; }
export interface PalpiteCrescimento { titulo: string; detalhe: string; evidencia: string; hipotese: boolean; }
export interface InsightsInstagram {
  habilitado: boolean; conta: ResumoContaInstagram | null; dias: number; postsNoPeriodo: number; postsPorSemana: number;
  alcanceNoPeriodo: number | null; seguidoresGanhosNoPeriodo: number | null; interacaoMedia: number | null;
  melhoresPosts: PostInstagram[]; horarios: HorarioSugerido[]; formatos: DesempenhoFormato[]; palpites: PalpiteCrescimento[];
  limitacoes: string[]; atualizadoEm: string;
}
export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const PERIODOS_INSIGHTS = [{ rotulo: 'Últimos 7 dias', valor: 7 }, { rotulo: 'Últimos 14 dias', valor: 14 }, { rotulo: 'Últimos 30 dias', valor: 30 }];

export function proximaOcorrencia(horario: HorarioSugerido, agora: Date = new Date()): Date {
  const minutosAlvo = horario.horaInicio * 60 + (horario.horaFim - horario.horaInicio) * 30;
  for (let dia = 0; dia < 8; dia++) {
    const candidata = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + dia, 0, minutosAlvo, 0, 0);
    if (candidata.getDay() === horario.diaSemana && candidata.getTime() > agora.getTime() + 10 * 60000) return candidata;
  }
  return new Date(agora.getTime() + 60 * 60000);
}
