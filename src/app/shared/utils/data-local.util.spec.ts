import { DatePipe, formatDate, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { dataCalendarioLocal, lerDataLocal } from './data-local.util';
import { formatarDataHora } from './formatar-data-hora.util';

describe('Datas locais', () => {
  beforeAll(() => registerLocaleData(localePt));

  it('usa o dia local perto da meia-noite em vez de recortar UTC', () => {
    const noite = new Date(2026, 10, 17, 23, 59);
    const madrugada = new Date(2026, 10, 18, 0, 1);
    expect(dataCalendarioLocal(noite)).toBe('2026-11-17');
    expect(dataCalendarioLocal(madrugada)).toBe('2026-11-18');
  });

  it('converte limites de calendário local para instantes UTC sem mudar o dia escolhido', () => {
    const inicio = lerDataLocal('2026-01-01')!;
    expect(inicio.getFullYear()).toBe(2026);
    expect(inicio.getMonth()).toBe(0);
    expect(inicio.getDate()).toBe(1);
    expect(inicio.getHours()).toBe(0);
    expect(inicio.toISOString()).toBe(new Date(2026, 0, 1).toISOString());
    expect(dataCalendarioLocal(new Date(inicio.toISOString()))).toBe('2026-01-01');
  });

  it('valida dias reais incluindo anos bissextos sem normalizar data inválida', () => {
    expect(lerDataLocal('2024-02-29')).not.toBeNull();
    for (const valor of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-00-01', '2026-01-00', '2026-01-32', '01/01/2026', '2026-01-01T00:00:00Z', '']) {
      expect(lerDataLocal(valor)).withContext(valor).toBeNull();
    }
    expect(dataCalendarioLocal(lerDataLocal('0099-01-01')!)).toBe('0099-01-01');
  });

  it('formata instantes no horário local e preserva datas sem horário', () => {
    const instante = '2026-01-01T00:30:00Z';
    expect(formatarDataHora(instante)).toBe(formatDate(instante, 'dd/MM/yyyy HH:mm', 'pt-BR'));
    expect(formatarDataHora(null)).toBe('-');
    expect(new DatePipe('pt-BR').transform('2026-01-01', 'dd/MM/yyyy')).toBe('01/01/2026');
  });
});
