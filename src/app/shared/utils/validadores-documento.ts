import { AbstractControl, ValidationErrors } from '@angular/forms';
import { somenteDigitos } from './formatacao.util';

function todosIguais(digitos: string): boolean {
  return /^(\d)\1+$/.test(digitos);
}

function digitoCpf(digitos: string, tamanho: number): number {
  let soma = 0;
  for (let i = 0; i < tamanho; i++) soma += Number(digitos[i]) * (tamanho + 1 - i);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function cpfValido(valor: string | null | undefined): boolean {
  const digitos = somenteDigitos(valor);
  if (digitos.length !== 11 || todosIguais(digitos)) return false;
  return digitoCpf(digitos, 9) === Number(digitos[9]) && digitoCpf(digitos, 10) === Number(digitos[10]);
}

function digitoCnpj(digitos: string, tamanho: number): number {
  const pesos = tamanho === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < tamanho; i++) soma += Number(digitos[i]) * pesos[i];
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(valor: string | null | undefined): boolean {
  const digitos = somenteDigitos(valor);
  if (digitos.length !== 14 || todosIguais(digitos)) return false;
  return digitoCnpj(digitos, 12) === Number(digitos[12]) && digitoCnpj(digitos, 13) === Number(digitos[13]);
}

export function cepValido(valor: string | null | undefined): boolean {
  return somenteDigitos(valor).length === 8;
}

function validador(teste: (valor: string) => boolean, chave: string) {
  return (controle: AbstractControl): ValidationErrors | null => {
    const digitos = somenteDigitos(controle.value);
    return !digitos || teste(digitos) ? null : { [chave]: true };
  };
}

export const cpfValidator = validador(cpfValido, 'cpfInvalido');
export const cnpjValidator = validador(cnpjValido, 'cnpjInvalido');
export const cepValidator = validador(cepValido, 'cepInvalido');
export const cpfCnpjValidator = validador(digitos => (digitos.length <= 11 ? cpfValido(digitos) : cnpjValido(digitos)), 'cpfCnpjInvalido');
