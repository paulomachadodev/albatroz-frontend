import { Component, ElementRef, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TipoMascara, formatarPorTipo, formatarValorSalvo, maximoDigitos, somenteDigitos } from '../../utils/formatacao.util';

@Component({
  selector: 'app-campo-mascara',
  standalone: true,
  template: `
    <input #entrada type="text" inputmode="numeric" autocomplete="off" spellcheck="false"
      [id]="inputId()" [value]="texto()" [attr.aria-label]="rotulo() || null" [placeholder]="placeholder()" [disabled]="desabilitado()"
      (input)="aoDigitar(entrada.value)" (blur)="aoSair()"
      class="w-full rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed" />
  `,
  host: { class: 'block' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoMascaraComponent), multi: true }]
})
export class CampoMascaraComponent implements ControlValueAccessor {
  readonly tipo = input.required<TipoMascara>();
  readonly emitir = input<'digitos' | 'formatado'>('digitos');
  readonly placeholder = input('');
  readonly inputId = input('');
  readonly rotulo = input('');
  readonly desabilitado = signal(false);
  readonly texto = signal('');
  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');
  private aoMudar: (valor: string) => void = () => undefined;
  private aoTocar: () => void = () => undefined;

  writeValue(valor: string | null | undefined): void {
    this.texto.set(formatarValorSalvo(this.tipo(), valor));
  }

  registerOnChange(funcao: (valor: string) => void): void {
    this.aoMudar = funcao;
  }

  registerOnTouched(funcao: () => void): void {
    this.aoTocar = funcao;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  aoDigitar(texto: string): void {
    const digitos = somenteDigitos(texto).slice(0, maximoDigitos(this.tipo()));
    const formatado = formatarPorTipo(this.tipo(), digitos);
    const campo = this.entrada().nativeElement;
    this.texto.set(formatado);
    campo.value = formatado;
    campo.setSelectionRange(formatado.length, formatado.length);
    this.aoMudar(this.emitir() === 'digitos' ? digitos : formatado);
  }

  aoSair(): void {
    this.aoTocar();
  }
}
