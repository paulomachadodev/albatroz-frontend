import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { By } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { SessaoInatividadeService } from './core/auth/sessao-inatividade.service';
import { AtualizacaoAppService } from './core/pwa/atualizacao-app.service';
import { ThemeService } from './core/theme/theme.service';

describe('AppComponent', () => {
  let sessao: jasmine.SpyObj<SessaoInatividadeService>;
  let atualizacao: jasmine.SpyObj<AtualizacaoAppService>;

  beforeEach(async () => {
    sessao = jasmine.createSpyObj<SessaoInatividadeService>('SessaoInatividadeService', ['iniciar']);
    atualizacao = jasmine.createSpyObj<AtualizacaoAppService>('AtualizacaoAppService', ['iniciar']);
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: SessaoInatividadeService, useValue: sessao },
        { provide: AtualizacaoAppService, useValue: atualizacao },
        { provide: ThemeService, useValue: {} }
      ]
    }).compileComponents();
  });

  it('cria o aplicativo e inicia os servicos de sessao e atualizacao', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
    expect(sessao.iniciar).toHaveBeenCalledTimes(1);
    expect(atualizacao.iniciar).toHaveBeenCalledTimes(1);
  });

  it('mantem o titulo do aplicativo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toBe('albatroz-frontend');
  });

  it('renderiza o ponto de entrada das paginas roteadas', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(RouterOutlet))).not.toBeNull();
  });
});
