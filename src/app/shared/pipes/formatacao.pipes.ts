import { Pipe, PipeTransform } from '@angular/core';
import { Moeda, TipoMascara, formatarMoeda, formatarValorSalvo } from '../utils/formatacao.util';

@Pipe({ name: 'moeda', standalone: true })
export class MoedaPipe implements PipeTransform {
  transform(valor: number | null | undefined, moeda: Moeda = 'BRL', casas = 2): string {
    return formatarMoeda(valor, moeda, casas);
  }
}

@Pipe({ name: 'mascara', standalone: true })
export class MascaraPipe implements PipeTransform {
  transform(valor: string | null | undefined, tipo: TipoMascara): string {
    return formatarValorSalvo(tipo, valor);
  }
}
