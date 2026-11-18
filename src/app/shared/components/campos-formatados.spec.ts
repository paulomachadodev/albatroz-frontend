import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CampoMascaraComponent } from './campo-mascara/campo-mascara.component';
import { CampoMoedaComponent } from './campo-moeda/campo-moeda.component';
import { MascaraPipe, MoedaPipe } from '../pipes/formatacao.pipes';
import { cpfCnpjValidator } from '../utils/validadores-documento';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CampoMoedaComponent, CampoMascaraComponent, MoedaPipe, MascaraPipe],
  template: `
    <app-campo-moeda id="reais" [formControl]="reais" moeda="BRL" />
    <app-campo-moeda id="dolares" [formControl]="dolares" moeda="USD" [casas]="4" placeholder="Sem limite" />
    <app-campo-mascara id="doc" [formControl]="documento" tipo="cpfCnpj" />
    <app-campo-mascara id="cep" [formControl]="cep" tipo="cep" emitir="formatado" />
    <span id="exibicao">{{ reais.value | moeda:'BRL' }} {{ documento.value | mascara:'cpfCnpj' }}</span>
  `
})
class HospedeiroComponent {
  readonly reais = new FormControl<number | null>(12);
  readonly dolares = new FormControl<number | null>(null);
  readonly documento = new FormControl<string>('09387885747', { nonNullable: true, validators: [cpfCnpjValidator] });
  readonly cep = new FormControl<string>('', { nonNullable: true });
}

describe('campos formatados', () => {
  function montar() {
    const fixture = TestBed.createComponent(HospedeiroComponent);
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;
    const campo = (id: string) => raiz.querySelector<HTMLInputElement>(`#${id} input`)!;
    const digitar = (id: string, texto: string) => { const el = campo(id); el.value = texto; el.dispatchEvent(new Event('input')); fixture.detectChanges(); };
    return { fixture, raiz, campo, digitar, host: fixture.componentInstance };
  }

  it('mostra o valor inicial já formatado', () => {
    const { campo, raiz } = montar();
    expect(campo('reais').value).toBe('R$ 12,00');
    expect(campo('dolares').value).toBe('');
    expect(campo('dolares').placeholder).toBe('Sem limite');
    expect(campo('doc').value).toBe('093.878.857-47');
    expect(raiz.querySelector('#exibicao')!.textContent).toContain('R$ 12,00 093.878.857-47');
  });

  it('moeda desloca os centavos ao digitar e devolve número', () => {
    const { campo, digitar, host } = montar();
    digitar('reais', 'R$ 12,003');
    expect(campo('reais').value).toBe('R$ 120,03');
    expect(host.reais.value).toBe(120.03);
    digitar('reais', 'R$ 120,0');
    expect(host.reais.value).toBe(12);
    digitar('reais', '');
    expect(campo('reais').value).toBe('');
    expect(host.reais.value).toBeNull();
    digitar('reais', 'abc');
    expect(host.reais.value).toBeNull();
  });

  it('dólar usa ponto, símbolo $ e casas configuradas', () => {
    const { campo, digitar, host, fixture } = montar();
    digitar('dolares', '500');
    expect(campo('dolares').value).toBe('$0.0500');
    expect(host.dolares.value).toBe(0.05);
    host.dolares.setValue(5);
    fixture.detectChanges();
    expect(campo('dolares').value).toBe('$5.0000');
  });

  it('documento aplica máscara, limita o tamanho e devolve só dígitos', () => {
    const { campo, digitar, host } = montar();
    digitar('doc', '5299822472599');
    expect(campo('doc').value).toBe('52.998.224/7259-9');
    digitar('doc', '52998224725');
    expect(campo('doc').value).toBe('529.982.247-25');
    expect(host.documento.value).toBe('52998224725');
    expect(host.documento.valid).toBeTrue();
    digitar('doc', '52998224726');
    expect(host.documento.hasError('cpfCnpjInvalido')).toBeTrue();
  });

  it('cep pode devolver o texto formatado', () => {
    const { campo, digitar, host } = montar();
    digitar('cep', '28970000999');
    expect(campo('cep').value).toBe('28970-000');
    expect(host.cep.value).toBe('28970-000');
  });

  it('respeita desabilitado do formulário', () => {
    const { campo, fixture, host } = montar();
    host.reais.disable();
    fixture.detectChanges();
    expect(campo('reais').disabled).toBeTrue();
  });
});
