import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CarregamentoPaginaService, ESPERA_ENCADEADAS_MS, LIMITE_CARREGAMENTO_MS } from './carregamento-pagina.service';

describe('CarregamentoPaginaService', () => {
  let eventos: Subject<unknown>;
  let servico: CarregamentoPaginaService;

  beforeEach(() => {
    eventos = new Subject<unknown>();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { events: eventos } }] });
    servico = TestBed.inject(CarregamentoPaginaService);
    servico.iniciar();
  });

  it('fica oculto sem navegacao', () => {
    expect(servico.visivel()).toBeFalse();
    expect(servico.requisicaoIniciada()).toBeFalse();
  });

  it('aparece na navegacao e fecha depois da espera quando nao ha requisicao', fakeAsync(() => {
    eventos.next(new NavigationStart(1, '/dashboard'));
    expect(servico.visivel()).toBeTrue();
    eventos.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    expect(servico.visivel()).toBeTrue();
    tick(ESPERA_ENCADEADAS_MS);
    expect(servico.visivel()).toBeFalse();
  }));

  it('espera todas as requisicoes da janela terminarem', fakeAsync(() => {
    eventos.next(new NavigationStart(1, '/dashboard'));
    const a = servico.requisicaoIniciada();
    const b = servico.requisicaoIniciada();
    eventos.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    tick(1000);
    expect(servico.visivel()).toBeTrue();
    servico.requisicaoTerminada(a);
    tick(1000);
    expect(servico.visivel()).toBeTrue();
    servico.requisicaoTerminada(b);
    tick(ESPERA_ENCADEADAS_MS);
    expect(servico.visivel()).toBeFalse();
  }));

  it('requisicao encadeada dentro da espera mantem visivel', fakeAsync(() => {
    eventos.next(new NavigationStart(1, '/dashboard'));
    const a = servico.requisicaoIniciada();
    eventos.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    servico.requisicaoTerminada(a);
    tick(ESPERA_ENCADEADAS_MS - 10);
    const b = servico.requisicaoIniciada();
    tick(ESPERA_ENCADEADAS_MS);
    expect(servico.visivel()).toBeTrue();
    servico.requisicaoTerminada(b);
    tick(ESPERA_ENCADEADAS_MS);
    expect(servico.visivel()).toBeFalse();
  }));

  it('requisicao fora da janela nao e contada', fakeAsync(() => {
    eventos.next(new NavigationStart(1, '/dashboard'));
    eventos.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    tick(ESPERA_ENCADEADAS_MS);
    expect(servico.requisicaoIniciada()).toBeFalse();
    expect(servico.visivel()).toBeFalse();
  }));

  it('libera a tela no limite mesmo com requisicao pendurada', fakeAsync(() => {
    eventos.next(new NavigationStart(1, '/dashboard'));
    servico.requisicaoIniciada();
    eventos.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    tick(LIMITE_CARREGAMENTO_MS);
    expect(servico.visivel()).toBeFalse();
  }));
});
