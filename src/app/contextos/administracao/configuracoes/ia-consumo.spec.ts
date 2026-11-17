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
import { filtrarConfiguracoes } from './configuracoes-catalogo';
import { IaConsumoComponent } from './pages/configuracoes-pagina/ia-consumo.component';
import { ConfiguracoesPaginaComponent } from './pages/configuracoes-pagina/configuracoes-pagina.component';
import { IaConsumo } from './models/ia-consumo.model';

describe('Consumo de IA', () => {
  const empresa = signal(1);
  const usuario = signal({ id: 1 });
  const permissoes = signal(['ia_consumo:ler']);
  let api: { get: jasmine.Spy };
  let toast: { aviso: jasmine.Spy; erro: jasmine.Spy; erroServidor: jasmine.Spy };
  const resposta = (): Resultado<IaConsumo> => ({ sucesso: true, dados: {
    habilitado: true, cobertura: 'validacao_google', inicioUtc: '2026-11-01T00:00:00Z', fimUtc: '2026-12-01T00:00:00Z', atualizadoEmUtc: '2026-11-17T20:00:00Z',
    resumo: { tentativas: 11, execucoes: 11, falhas: 10, pendentes: 0, custosPendentes: 10, custosCalculados: 1, tokensEntrada: null, tokensSaida: 0, tokensThinking: null, tokensCache: null, semUsoInformado: 10, custoCalculadoUsd: 0.00000001 },
    itens: [{ id: 1, tentativaId: 'tentativa', execucaoId: 'execucao', numeroTentativa: 1, finalidade: 'validacao_google', modulo: 'configuracoes', provedor: 'google', modeloSolicitado: 'gemini-2.5-flash-lite', modeloEfetivo: null, status: 3, statusApuracao: 1, httpStatus: 403, iniciadoEmUtc: '2026-11-17T20:00:00Z', concluidoEmUtc: null, duracaoMs: null, tokensEntrada: null, tokensSaida: 0, tokensThinking: null, tokensCache: null, custoUsd: null, tarifaVersao: null, tarifaFonte: null }],
    total: 11, pagina: 1, tamanhoPagina: 10
  } });

  beforeEach(() => {
    empresa.set(1);
    usuario.set({ id: 1 });
    permissoes.set(['ia_consumo:ler']);
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

  it('preserva microcustos, desconhecidos e cobertura sem prometer fatura completa', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    expect(api.get.calls.mostRecent().args[0]).toBe('/v1/ia/consumo');
    expect(pagina.totalPaginas()).toBe(2);
    const texto = harness.routeNativeElement?.textContent ?? '';
    expect(texto).toContain('USD 0,00000001');
    expect(texto).toContain('Não informado');
    expect(texto).toContain('Pendente');
    expect(texto).toContain('somente validações');
    expect(texto).not.toContain('R$');
    expect(pagina.custo(0)).toBe('USD 0,00');
    expect(pagina.custo(0.0000000000001)).toContain('<');
    expect(pagina.fonte('javascript:alert(1)')).toBeNull();
    expect(pagina.fonte('https://ai.google.dev/gemini-api/docs/pricing')).toContain('ai.google.dev');
  });

  it('não exibe zero como custo quando não há requisições medidas', async () => {
    const vazio = resposta();
    vazio.dados!.resumo.tentativas = 0;
    vazio.dados!.resumo.custoCalculadoUsd = null;
    vazio.dados!.itens = [];
    vazio.dados!.total = 0;
    api.get.and.returnValue(of(vazio));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Não medido');
    expect(harness.routeNativeElement?.textContent).not.toContain('USD 0,00');
  });

  it('envia filtros e mantém a consulta aplicada na paginação sem empresa arbitrária', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    pagina.form.setValue({ inicio: '2026-01-01', fim: '2026-02-01', finalidade: 'validacao_google', modelo: ' gemini-2.5-flash-lite ', status: 2 });
    pagina.aplicar();
    expect(api.get.calls.mostRecent().args[1]).toEqual({ inicio: new Date(2026, 0, 1).toISOString(), fim: new Date(2026, 1, 1).toISOString(), pagina: 1, tamanhoPagina: 10, finalidade: 'validacao_google', modelo: 'gemini-2.5-flash-lite', status: 2 });
    pagina.form.controls.modelo.setValue('outro');
    pagina.mudarPagina(2);
    expect(api.get.calls.mostRecent().args[1].modelo).toBe('gemini-2.5-flash-lite');
    expect(api.get.calls.mostRecent().args[1].pagina).toBe(2);
    pagina.mudarTamanho(50);
    expect(api.get.calls.mostRecent().args[1].pagina).toBe(1);
  });

  it('recusa período inválido e superior a 366 dias antes da API', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    api.get.calls.reset();
    for (const periodo of [{ inicio: '2026-02-30', fim: '2026-03-01' }, { inicio: '2026-03-01', fim: '2026-02-01' }, { inicio: '2024-01-01', fim: '2026-02-01' }]) {
      pagina.form.patchValue(periodo);
      pagina.aplicar();
    }
    expect(api.get).not.toHaveBeenCalled();
    expect(toast.aviso).toHaveBeenCalledTimes(3);
  });

  it('cancela e limpa a consulta quando a empresa muda', async () => {
    const pendente = new Subject<Resultado<IaConsumo>>();
    api.get.and.returnValue(pendente);
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    expect(pendente.observed).toBeTrue();
    empresa.set(2);
    TestBed.flushEffects();
    expect(pendente.observed).toBeFalse();
    pendente.next(resposta());
    expect(pagina.dados()).toBeNull();
  });

  it('nega rota e catálogo sem permissão dedicada', async () => {
    permissoes.set(['ia_configuracoes:ler']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/configuracoes/ia/consumo');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(api.get).not.toHaveBeenCalled();
    expect(filtrarConfiguracoes(chave => chave === 'ia_configuracoes:ler', false).flatMap(grupo => grupo.destinos).some(destino => destino.id === 'ia-consumo')).toBeFalse();
  });

  it('limpa dados no erro e mostra feedback padrão', async () => {
    api.get.and.returnValue(throwError(() => new Error('falha')));
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    expect(pagina.carregando()).toBeFalse();
    expect(pagina.dados()).toBeNull();
    expect(toast.erroServidor).toHaveBeenCalled();
  });
});
