export type Moeda = 'BRL' | 'USD';
export type TipoMascara = 'cpf' | 'cnpj' | 'cpfCnpj' | 'cep' | 'telefone';

const LOCALE_POR_MOEDA: Record<Moeda, string> = { BRL: 'pt-BR', USD: 'en-US' };
const MAXIMO_DIGITOS_MOEDA = 15;

const MAXIMO_DIGITOS: Record<TipoMascara, number> = { cpf: 11, cnpj: 14, cpfCnpj: 14, cep: 8, telefone: 11 };

export function somenteDigitos(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\D/g, '');
}

export function formatarMoeda(valor: number | null | undefined, moeda: Moeda = 'BRL', casas = 2): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '';
  return new Intl.NumberFormat(LOCALE_POR_MOEDA[moeda], {
    style: 'currency', currency: moeda, minimumFractionDigits: casas, maximumFractionDigits: casas
  }).format(valor).replace(/ /g, ' ');
}

export function digitosParaValor(digitos: string, casas = 2): number | null {
  const limpos = somenteDigitos(digitos).slice(0, MAXIMO_DIGITOS_MOEDA);
  if (!limpos) return null;
  return Number((Number(limpos) / 10 ** casas).toFixed(casas));
}

export function valorParaDigitos(valor: number | null | undefined, casas = 2): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '';
  return String(Math.round(valor * 10 ** casas));
}

function aplicarPadrao(digitos: string, padrao: string): string {
  let resultado = '';
  let indice = 0;
  for (const caractere of padrao) {
    if (indice >= digitos.length) break;
    if (caractere === '0') {
      resultado += digitos[indice];
      indice++;
    } else {
      resultado += caractere;
    }
  }
  return resultado;
}

export function formatarCpf(valor: string | null | undefined): string {
  return aplicarPadrao(somenteDigitos(valor).slice(0, 11), '000.000.000-00');
}

export function formatarCnpj(valor: string | null | undefined): string {
  return aplicarPadrao(somenteDigitos(valor).slice(0, 14), '00.000.000/0000-00');
}

export function formatarCpfCnpj(valor: string | null | undefined): string {
  const digitos = somenteDigitos(valor);
  return digitos.length <= 11 ? formatarCpf(digitos) : formatarCnpj(digitos);
}

export function formatarCep(valor: string | null | undefined): string {
  return aplicarPadrao(somenteDigitos(valor).slice(0, 8), '00000-000');
}

export function formatarTelefone(valor: string | null | undefined): string {
  const digitos = somenteDigitos(valor).slice(0, 11);
  return aplicarPadrao(digitos, digitos.length > 10 ? '(00) 00000-0000' : '(00) 0000-0000');
}

export function formatarPorTipo(tipo: TipoMascara, valor: string | null | undefined): string {
  switch (tipo) {
    case 'cpf': return formatarCpf(valor);
    case 'cnpj': return formatarCnpj(valor);
    case 'cpfCnpj': return formatarCpfCnpj(valor);
    case 'cep': return formatarCep(valor);
    case 'telefone': return formatarTelefone(valor);
  }
}

export function maximoDigitos(tipo: TipoMascara): number {
  return MAXIMO_DIGITOS[tipo];
}
