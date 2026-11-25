import { SITUACAO_WAHA, WahaStatus, apresentarStatusWaha, formatarNumeroWaha, normalizarTelefoneBloqueio } from './models/waha.model';

const status = (situacao: WahaStatus['situacao'], extra: Partial<WahaStatus> = {}): WahaStatus =>
  ({ configurada: true, situacao, numero: null, nomePerfil: null, mensagem: null, ...extra });

describe('integração WAHA', () => {
  it('apresenta cada situação em português e com a cor certa', () => {
    expect(apresentarStatusWaha(null).titulo).toBe('Verificando o WhatsApp…');
    expect(apresentarStatusWaha({ ...status(SITUACAO_WAHA.Parado), configurada: false }).titulo).toBe('WhatsApp ainda não configurado');
    expect(apresentarStatusWaha(status(SITUACAO_WAHA.Parado))).toEqual(jasmine.objectContaining({ titulo: 'WhatsApp desconectado', cor: 'cinza' }));
    expect(apresentarStatusWaha(status(SITUACAO_WAHA.Iniciando))).toEqual(jasmine.objectContaining({ titulo: 'Conectando…', cor: 'azul' }));
    expect(apresentarStatusWaha(status(SITUACAO_WAHA.AguardandoLeitura))).toEqual(jasmine.objectContaining({ titulo: 'Escaneie o código para conectar', cor: 'amarelo' }));
    expect(apresentarStatusWaha(status(SITUACAO_WAHA.Falha, { mensagem: 'Servidor fora do ar' }))).toEqual(jasmine.objectContaining({ cor: 'vermelho', detalhe: 'Servidor fora do ar' }));
  });

  it('mostra número e nome quando conectado', () => {
    const resultado = apresentarStatusWaha(status(SITUACAO_WAHA.Conectado, { numero: '5522988268614', nomePerfil: 'Albatroz Papelaria' }));
    expect(resultado).toEqual(jasmine.objectContaining({ titulo: 'WhatsApp conectado', cor: 'verde' }));
    expect(resultado.detalhe).toBe('(22) 98826-8614 · Albatroz Papelaria');
  });

  it('formata telefone brasileiro e preserva o que não reconhece', () => {
    expect(formatarNumeroWaha('5522988268614')).toBe('(22) 98826-8614');
    expect(formatarNumeroWaha('552288268614')).toBe('(22) 8826-8614');
    expect(formatarNumeroWaha(null)).toBe('');
    expect(formatarNumeroWaha('abc')).toBe('abc');
  });

  it('acrescenta o DDI 55 só quando o telefone vem com DDD', () => {
    expect(normalizarTelefoneBloqueio('22988268614')).toBe('5522988268614');
    expect(normalizarTelefoneBloqueio('(22) 8826-8614')).toBe('552288268614');
    expect(normalizarTelefoneBloqueio('5522988268614')).toBe('5522988268614');
  });
});
