import { cepValido, cnpjValido, cpfValido } from './validadores-documento';
import {
  digitosParaValor, formatarCep, formatarCnpj, formatarCpf, formatarCpfCnpj, formatarMoeda, formatarTelefone, somenteDigitos, valorParaDigitos
} from './formatacao.util';

describe('formatação', () => {
  it('formata reais e dólares no padrão do sistema', () => {
    expect(formatarMoeda(12, 'BRL')).toBe('R$ 12,00');
    expect(formatarMoeda(1234.5, 'BRL')).toBe('R$ 1.234,50');
    expect(formatarMoeda(5, 'USD')).toBe('$5.00');
    expect(formatarMoeda(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatarMoeda(0.05, 'USD', 4)).toBe('$0.0500');
    expect(formatarMoeda(0, 'BRL')).toBe('R$ 0,00');
    expect(formatarMoeda(null)).toBe('');
    expect(formatarMoeda(undefined, 'USD')).toBe('');
    expect(formatarMoeda(Number.NaN)).toBe('');
  });

  it('converte dígitos digitados em valor sem erro de ponto flutuante', () => {
    expect(digitosParaValor('1200')).toBe(12);
    expect(digitosParaValor('5')).toBe(0.05);
    expect(digitosParaValor('R$ 12,003')).toBe(120.03);
    expect(digitosParaValor('')).toBeNull();
    expect(digitosParaValor('abc')).toBeNull();
    expect(digitosParaValor('1234', 4)).toBe(0.1234);
    expect(digitosParaValor('9999999999999999999')).toBe(9999999999999.99);
    expect(valorParaDigitos(12.34)).toBe('1234');
    expect(valorParaDigitos(null)).toBe('');
  });

  it('aplica as máscaras de documento e contato', () => {
    expect(formatarCpf('09387885747')).toBe('093.878.857-47');
    expect(formatarCpf('0938')).toBe('093.8');
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(formatarCpfCnpj('09387885747')).toBe('093.878.857-47');
    expect(formatarCpfCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(formatarCep('28970000')).toBe('28970-000');
    expect(formatarCep('289')).toBe('289');
    expect(formatarTelefone('22999998888')).toBe('(22) 99999-8888');
    expect(formatarTelefone('2233334444')).toBe('(22) 3333-4444');
    expect(formatarCpf(null)).toBe('');
    expect(somenteDigitos('093.878.857-47')).toBe('09387885747');
  });

  it('valida CPF, CNPJ e CEP', () => {
    expect(cpfValido('529.982.247-25')).toBeTrue();
    expect(cpfValido('52998224726')).toBeFalse();
    expect(cpfValido('111.111.111-11')).toBeFalse();
    expect(cpfValido('123')).toBeFalse();
    expect(cnpjValido('11.222.333/0001-81')).toBeTrue();
    expect(cnpjValido('11.222.333/0001-82')).toBeFalse();
    expect(cnpjValido('00000000000000')).toBeFalse();
    expect(cepValido('28970-000')).toBeTrue();
    expect(cepValido('2897')).toBeFalse();
  });
});
