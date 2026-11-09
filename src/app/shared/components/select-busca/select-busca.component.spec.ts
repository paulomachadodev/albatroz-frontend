import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AutoComplete } from 'primeng/autocomplete';
import { Subject, of } from 'rxjs';
import { OpcaoSelectBusca, SelectBuscaComponent } from './select-busca.component';

describe('SelectBuscaComponent', () => {
  let fixture: ComponentFixture<SelectBuscaComponent>;
  const marca = { id: 1, nome: 'Luxcel' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectBuscaComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectBuscaComponent);
    fixture.componentRef.setInput('buscar', () => of([marca]));
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('exibe as sugestoes fora do painel que corta os filtros', fakeAsync(() => {
    fixture.nativeElement.style.overflow = 'hidden';
    fixture.nativeElement.style.maxHeight = '40px';
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('input');
    campo.focus();
    campo.value = 'lux';
    campo.dispatchEvent(new Event('input'));
    tick(350);
    fixture.detectChanges();
    tick(200);
    fixture.detectChanges();
    const lista = document.body.querySelector('[role="listbox"]');
    expect(lista).not.toBeNull();
    expect(lista?.textContent).toContain('Luxcel');
    expect(fixture.nativeElement.contains(lista)).toBeFalse();
  }));

  it('preserva a opcao selecionada e o contrato usado pelas paginas', async () => {
    fixture.componentRef.setInput('valorSelecionado', marca);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(campo.value).toBe('Luxcel');
    const emitir = spyOn(fixture.componentInstance.selecionado, 'emit');
    fixture.debugElement.query(By.directive(AutoComplete)).triggerEventHandler('onSelect', { value: marca });
    expect(emitir).toHaveBeenCalledWith(marca);
    fixture.componentInstance.limpar();
    expect(emitir).toHaveBeenCalledWith(null);
  });

  it('ignora respostas de buscas substituidas', () => {
    const primeira = new Subject<OpcaoSelectBusca[]>();
    const segunda = new Subject<OpcaoSelectBusca[]>();
    fixture.componentRef.setInput('buscar', (termo: string) => termo === 'lu' ? primeira : segunda);
    fixture.componentInstance.executarBusca('lu');
    fixture.componentInstance.executarBusca('lux');
    segunda.next([marca]);
    primeira.next([{ id: 2, nome: 'Outra marca' }]);
    expect(fixture.componentInstance.resultados()).toEqual([marca]);
  });
});

