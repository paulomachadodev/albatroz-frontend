import { Component, ElementRef, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Moeda, digitosParaValor, formatarMoeda } from '../../utils/formatacao.util';

@Component({
  selector: 'app-campo-moeda',
  standalone: true,
  template: `
    <input #entrada type="text" inputmode="numeric" autocomplete="off" spellcheck="false"
      [id]="inputId()" [value]="texto()" [attr.aria-label]="rotulo() || null" [placeholder]="placeholder()" [disabled]="desabilitado()"
      (input)="aoDigitar(entrada.value)" (blur)="aoSair()"
      class="w-full rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed" />
  `,
  host: { class: 'block' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoMoedaComponent), multi: true }]
})
export class CampoMoedaComponent implements ControlValueAccessor {
  readonly moeda = input<Moeda>('BRL');
  readonly casas = input(2);
  readonly placeholder = input('');
  readonly inputId = input('');
  readonly rotulo = input('');
  readonly desabilitado = signal(false);
  readonly texto = signal('');
  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');
  private aoMudar: (valor: number | null) => void = () => undefined;
  private aoTocar: () => void = () => undefined;

  writeValue(valor: number | null | undefined): void {
    this.texto.set(formatarMoeda(valor, this.moeda(), this.casas()));
  }

  registerOnChange(funcao: (valor: number | null) => void): void {
    this.aoMudar = funcao;
  }

  registerOnTouched(funcao: () => void): void {
    this.aoTocar = funcao;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  aoDigitar(texto: string): void {
    const valor = digitosParaValor(texto, this.casas());
    const campo = this.entrada().nativeElement;
    const formatado = formatarMoeda(valor, this.moeda(), this.casas());
    this.texto.set(formatado);
    campo.value = formatado;
    campo.setSelectionRange(formatado.length, formatado.length);
    this.aoMudar(valor);
  }

  aoSair(): void {
    this.aoTocar();
  }
}
