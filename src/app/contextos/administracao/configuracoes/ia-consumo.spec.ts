import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IaConsumoService } from './services/ia-consumo.service';
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
      provideHttpClient(), provideHttpClientTesting(),
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
    pagina.form.setValue({ inicio: '2026-01-01', fim: '2026-02-01', finalidade: 'validacao_google', modelo: ' gemini-2.5-flash-lite ', status: 2, modulo: ' configuracoes ', provedor: ' google ' });
    pagina.aplicar();
    expect(api.get.calls.mostRecent().args[1]).toEqual({ inicio: new Date(2026, 0, 1).toISOString(), fim: new Date(2026, 1, 1).toISOString(), pagina: 1, tamanhoPagina: 10, finalidade: 'validacao_google', modelo: 'gemini-2.5-flash-lite', status: 2, modulo: 'configuracoes', provedor: 'google', fusoHorario: pagina.fusoHorario });
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
  it('mantém dias do calendário local e custos pendentes nos agregados de todas as páginas', async () => {
    const retorno = resposta();
    retorno.dados!.painel = {
      fusoHorario: 'America/Sao_Paulo', inicioMedicaoUtc: '2026-11-17T20:00:00Z',
      dias: [{ data: '2026-11-17', tentativas: 11, custosPendentes: 10, custoUsd: null }],
      finalidades: [{ nome: 'validacao_google', tentativas: 11, custosPendentes: 10, custoUsd: 0.00000001 }],
      modelos: [{ nome: 'gemini-2.5-flash-lite', tentativas: 11, custosPendentes: 10, custoUsd: null }]
    };
    api.get.and.returnValue(of(retorno));
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    expect(pagina.graficoDiario().labels).toEqual(['17/11/2026']);
    expect(pagina.graficoDiario().datasets[0].data).toEqual([null]);
    expect(pagina.graficoFinalidades().datasets[0].data).toEqual([0.00000001]);
    expect(pagina.graficoModelos().datasets[0].data).toEqual([null]);
    expect(harness.routeNativeElement?.textContent).toContain('America/Sao_Paulo');
    expect(harness.routeNativeElement?.textContent).toContain('11 requisições');
  });

  it('exporta com filtros aplicados e exige permissão própria', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    const service = TestBed.inject(IaConsumoService);
    const exportar = spyOn(service, 'exportar').and.returnValue(of(new Blob(['data;custo'])));
    const criarUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:arquivo');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    pagina.exportar();
    expect(exportar).not.toHaveBeenCalled();
    permissoes.set(['ia_consumo:ler', 'ia_consumo:exportar']);
    TestBed.flushEffects();
    pagina.form.controls.modelo.setValue('não aplicado');
    pagina.exportar();
    expect(exportar.calls.mostRecent().args[0].modelo).toBeUndefined();
    expect(exportar.calls.mostRecent().args[0].fusoHorario).toBe(pagina.fusoHorario);
    expect(criarUrl).toHaveBeenCalled();
    expect(pagina.exportando()).toBeFalse();
  });

  it('cancela exportação sem baixar dados após troca da empresa ou perda da permissão', async () => {
    permissoes.set(['ia_consumo:ler', 'ia_consumo:exportar']);
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    const pendente = new Subject<Blob>();
    spyOn(TestBed.inject(IaConsumoService), 'exportar').and.returnValue(pendente);
    const baixar = spyOn(URL, 'createObjectURL');
    pagina.exportar();
    expect(pendente.observed).toBeTrue();
    permissoes.set(['ia_consumo:ler']);
    TestBed.flushEffects();
    expect(pendente.observed).toBeFalse();
    expect(pagina.exportando()).toBeFalse();
    pendente.next(new Blob(['antiga empresa']));
    expect(baixar).not.toHaveBeenCalled();
    permissoes.set(['ia_consumo:ler', 'ia_consumo:exportar']);
    TestBed.flushEffects();
    pagina.exportar();
    empresa.set(2);
    TestBed.flushEffects();
    pendente.next(new Blob(['antiga empresa']));
    expect(baixar).not.toHaveBeenCalled();
  });

  it('interpreta erro JSON recebido como Blob na exportação', async () => {
    permissoes.set(['ia_consumo:ler', 'ia_consumo:exportar']);
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    spyOn(TestBed.inject(IaConsumoService), 'exportar').and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: new Blob([JSON.stringify({ erro: { mensagem: 'Limite de 10000 registros.' } })], { type: 'application/json' }) })));
    pagina.exportar();
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(pagina.exportando()).toBeFalse();
    const erro = toast.erroServidor.calls.mostRecent().args[0] as HttpErrorResponse;
    expect(erro.error.erro.mensagem).toContain('10000');
  });

  it('envia CSV via HTTP autenticado sem empresa arbitrária nos parâmetros', () => {
    TestBed.inject(IaConsumoService).exportar({ inicio: '2026-11-01T03:00:00Z', fim: '2026-12-01T03:00:00Z', pagina: 1, tamanhoPagina: 10, fusoHorario: 'America/Sao_Paulo', modulo: 'configuracoes', provedor: 'google' }).subscribe();
    const http = TestBed.inject(HttpTestingController);
    const pedido = http.expectOne(req => req.url.endsWith('/v1/ia/consumo/exportacao'));
    expect(pedido.request.responseType).toBe('blob');
    expect(pedido.request.params.get('fusoHorario')).toBe('America/Sao_Paulo');
    expect(pedido.request.params.has('empresaId')).toBeFalse();
    pedido.flush(new Blob(['csv']));
    http.verify();
  });

  it('descarta erro Blob pendente ao sair da página', async () => {
    permissoes.set(['ia_consumo:ler', 'ia_consumo:exportar']);
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    let concluirLeitura!: (conteudo: string) => void;
    const corpo = new Blob(['erro']);
    spyOn(corpo, 'text').and.returnValue(new Promise<string>(resolve => { concluirLeitura = resolve; }));
    spyOn(TestBed.inject(IaConsumoService), 'exportar').and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: corpo })));
    pagina.exportar();
    expect(pagina.exportando()).toBeTrue();
    await harness.navigateByUrl('/dashboard');
    concluirLeitura(JSON.stringify({ erro: { mensagem: 'Resposta antiga.' } }));
    await Promise.resolve();
    expect(toast.erroServidor).not.toHaveBeenCalled();
    expect(pagina.exportando()).toBeFalse();
  });

  it('exibe a cobertura ampliada somente quando informada pelo serviço', async () => {
    const retorno = resposta(); retorno.dados!.cobertura = 'fluxos_google'; api.get.and.returnValue(of(retorno));
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/consumo', IaConsumoComponent);
    expect(harness.routeNativeElement?.textContent).toContain('fluxos Google instrumentados');
    expect(harness.routeNativeElement?.textContent).not.toContain('somente validações');
    expect(pagina.coberturaTexto()).not.toContain('todo');
    expect(pagina.finalidades.map(finalidade => finalidade.valor)).toEqual(['', 'validacao_google', 'lista_escolar', 'fatura', 'classificacao_produto', 'descricao_produto', 'tendencia_volta_aulas', 'embedding', 'marketing_conteudo']);
    expect(pagina.nomeFinalidade('classificacao_produto')).toBe('Classificação de produto');
    pagina.dados.set({ ...retorno.dados!, cobertura: 'fluxos_google,marketing_conteudo' });
    expect(pagina.coberturaTexto()).toContain('geração de textos de marketing');
    pagina.dados.set({ ...retorno.dados!, cobertura: 'validacao_google,marketing_conteudo' });
    expect(pagina.coberturaTexto()).not.toContain('fluxos Google instrumentados');
    pagina.dados.set({ ...retorno.dados!, cobertura: 'cobertura_futura' });
    expect(pagina.coberturaTexto()).toBe('Cobertura não informada.');
    pagina.dados.set(null);
    expect(pagina.coberturaTexto()).toBe('Cobertura não informada.');
  });

});
