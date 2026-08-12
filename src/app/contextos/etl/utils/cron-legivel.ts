/**
 * Traduz os padrões de cron usados em EtlJobScheduler.cs para texto legível.
 * Cobre só os ~6 formatos reais do projeto (min fixo/passo, com ou sem janela
 * de horas noturna); qualquer coisa fora disso cai no fallback (expressão crua).
 */
export function formatarCron(cron: string): string {
  const partes = cron.trim().split(/\s+/);
  if (partes.length !== 5) return cron;

  const [minParte, horaParte, dom, mes, dow] = partes;
  if (dom !== '*' || mes !== '*' || dow !== '*') return cron;

  const janela = formatarJanelaHoras(horaParte);

  const stepMatch = minParte.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const n = stepMatch[1];
    const rotulo = n === '1' ? 'A cada minuto' : `A cada ${n} min`;
    return janela ? `${rotulo}, ${janela}` : rotulo;
  }

  const horaUnica = horaParte !== '*' && !horaParte.includes(',') && !horaParte.includes('-');
  const minUnico = /^\d+$/.test(minParte);

  if (horaUnica && minUnico) {
    return `Todo dia ${formatarHorario(Number(horaParte), Number(minParte))}`;
  }

  if (/^[\d,]+$/.test(minParte)) {
    const minutos = minParte.split(',');
    const rotulo = minutos.length === 1 ? `Ao minuto ${minutos[0]}` : `Aos minutos ${juntarLista(minutos)}`;
    return janela ? `${rotulo}, ${janela}` : `${rotulo} de cada hora`;
  }

  return cron;
}

function formatarJanelaHoras(horaParte: string): string | null {
  if (horaParte === '*') return null;
  const segmentos = horaParte.split(',');
  const primeiro = segmentos[0].split('-')[0];
  const ultimoSeg = segmentos[segmentos.length - 1];
  const ultimo = ultimoSeg.includes('-') ? ultimoSeg.split('-')[1] : ultimoSeg;
  return `das ${primeiro}h às ${ultimo}h`;
}

function formatarHorario(h: number, m: number): string {
  if (h === 0 && m === 0) return 'à meia-noite';
  if (h === 12 && m === 0) return 'ao meio-dia';
  const mm = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
  return `às ${h}${mm}h`;
}

function juntarLista(itens: string[]): string {
  if (itens.length === 1) return itens[0];
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}
