import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/feedback/toast.service';
import { EmpresaFlagsService } from '../../../core/empresa/empresa-flags.service';
import { Resultado } from '../../../core/models/resultado.model';
import { CONFIGURACOES_ROUTES } from './configuracoes.routes';
import { IaValidacoesComponent } from './pages/configuracoes-pagina/ia-validacoes.component';
import { ConfiguracoesPaginaComponent } from './pages/configuracoes-pagina/configuracoes-pagina.component';
import { IaValidacoes } from './models/ia-validacoes.model';

describe('Histórico de validações Google', () => {
  const empresa = signal(1);
  const usuario = signal({ id: 1 });
  const permissoes = signal(['ia_configuracoes:ler']);
  let api: { get: jasmine.Spy };
  let toast: { aviso: jasmine.Spy; erro: jasmine.Spy; erroServidor: jasmine.Spy };
  const resposta = (): Resultado<IaValidacoes> => ({ sucesso: true, dados: {
    habilitado: true, cobertura: 'validacoes_google', inicioUtc: '2026-11-01T00:00:00Z', fimUtc: '2026-12-01T00:00:00Z', atualizadoEmUtc: '2026-11-16T20:00:00Z',
    resumo: { tentativas: 51, validadas: 1, falhas: 50, pendentes: 0, indeterminadas: 0, conflitos: 0, tokensEntrada: null, tokensSaida: 0, tokensThinking: null, tokensCache: null, semUsoInformado: 51, custo: null },
    itens: [{ id: 1, modelo: 'gemini-2.5-flash-lite', modeloEfetivo: null, status: 3, httpStatus: 403, criadoEmUtc: '2026-11-16T20:00:00Z', atualizadoEmUtc: '2026-11-16T20:00:00Z', tokensEntrada: null, tokensSaida: 0, tokensThinking: null, tokensCache: null, custo: null }],
    total: 51, pagina: 1, tamanhoPagina: 10
  } });

  beforeEach(() => {
    empresa.set(1);
    usuario.set({ id: 1 });
    permissoes.set(['ia_configuracoes:ler']);
    api = { get: jasmine.createSpy('get').and.returnValue(of(resposta())) };
    toast = { aviso: jasmine.createSpy('aviso'), erro: jasmine.createSpy('erro'), erroServidor: jasmine.createSpy('erroServidor') };
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'configuracoes', children: CONFIGURACOES_ROUTES }, { path: 'dashboard', component: ConfiguracoesPaginaComponent }]),
      { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: (permissao: string) => permissoes().includes(permissao) } },
      { provide: EmpresaFlagsService, useValue: { carregar: () => undefined, tinyAtivo: () => false } },
      { provide: ApiService, useValue: api },
      { provide: ToastService, useValue: toast }
    ] });
  });

  it('consulta apenas histórico de validações, preserva desconhecido e não inventa custo', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/validacoes', IaValidacoesComponent);
    expect(api.get.calls.mostRecent().args[0]).toBe('/v1/configuracoes/ia/validacoes');
    expect(new Date(api.get.calls.mostRecent().args[1].inicio).getHours()).toBe(0);
    expect(pagina.totalPaginas()).toBe(6);
    const texto = harness.routeNativeElement?.textContent ?? '';
    expect(texto).toContain('Não informado');
    expect(texto).toContain('Apuração pendente');
    expect(texto).toContain('somente as validações');
    expect(texto).not.toContain('R$');
    expect(texto).not.toContain('ChaveGoogle');
  });

  it('envia período UTC e paginação sem aplicar alterações de filtro ainda não consultadas', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/validacoes', IaValidacoesComponent);
    pagina.form.setValue({ inicio: '2026-01-01', fim: '2026-02-01' });
    pagina.aplicar();
    expect(api.get.calls.mostRecent().args[1]).toEqual({ inicio: new Date(2026, 0, 1).toISOString(), fim: new Date(2026, 1, 1).toISOString(), pagina: 1, tamanhoPagina: 10 });
    pagina.form.controls.inicio.setValue('2026-01-20');
    pagina.mudarPagina(2);
    expect(api.get.calls.mostRecent().args[1].inicio).toBe(new Date(2026, 0, 1).toISOString());
    expect(api.get.calls.mostRecent().args[1].pagina).toBe(2);
    pagina.mudarTamanho(50);
    expect(api.get.calls.mostRecent().args[1].pagina).toBe(1);
    expect(api.get.calls.mostRecent().args[1].tamanhoPagina).toBe(50);
  });

  it('recusa datas inválidas e períodos acima de 366 dias antes de chamar API', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/validacoes', IaValidacoesComponent);
    api.get.calls.reset();
    for (const periodo of [{ inicio: '2026-02-30', fim: '2026-03-01' }, { inicio: '2026-03-01', fim: '2026-02-01' }, { inicio: '2024-01-01', fim: '2026-02-01' }]) {
      pagina.form.setValue(periodo);
      pagina.aplicar();
    }
    expect(api.get).not.toHaveBeenCalled();
    expect(toast.aviso).toHaveBeenCalledTimes(3);
  });

  it('cancela resposta da empresa anterior e limpa dados ao trocar sessão', async () => {
    const respostaPendente = new Subject<Resultado<IaValidacoes>>();
    api.get.and.returnValue(respostaPendente);
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/validacoes', IaValidacoesComponent);
    expect(respostaPendente.observed).toBeTrue();
    empresa.set(2);
    TestBed.flushEffects();
    expect(respostaPendente.observed).toBeFalse();
    respostaPendente.next(resposta());
    expect(pagina.dados()).toBeNull();
  });

  it('nega acesso sem permissão dedicada e não consulta API', async () => {
    permissoes.set(['configuracoes:ler']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/configuracoes/ia/validacoes');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('encerra carregamento e usa feedback padrão quando API falha', async () => {
    api.get.and.returnValue(throwError(() => new Error('falha')));
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/validacoes', IaValidacoesComponent);
    expect(pagina.carregando()).toBeFalse();
    expect(pagina.dados()).toBeNull();
    expect(toast.erroServidor).toHaveBeenCalled();
  });
});
