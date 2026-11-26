import { descreverEspera } from './models/agente-atendimento.model';

describe('agente de atendimento IA', () => {
  it('explica a espera em segundos e em minutos', () => {
    expect(descreverEspera(0)).toBe('A Albia responde assim que a mensagem chega.');
    expect(descreverEspera(30)).toContain('30 segundos');
    expect(descreverEspera(60)).toContain('1 min depois');
    expect(descreverEspera(90)).toContain('1 min e 30 s');
  });
});
