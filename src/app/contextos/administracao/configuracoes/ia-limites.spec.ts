import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/feedback/toast.service';
import { ConfirmService } from '../../../core/feedback/confirm.service';
import { EmpresaFlagsService } from '../../../core/empresa/empresa-flags.service';
import { Resultado } from '../../../core/models/resultado.model';
import { CONFIGURACOES_ROUTES } from './configuracoes.routes';
import { filtrarConfiguracoes } from './configuracoes-catalogo';
import { IaLimitesComponent } from './pages/configuracoes-pagina/ia-limites.component';
import { ConfiguracoesPaginaComponent } from './pages/configuracoes-pagina/configuracoes-pagina.component';
import { IaLimites } from './models/ia-limites.model';

const limiteFixture = (): Resultado<IaLimites> => ({ sucesso: true, dados: {
  habilitado: true, cobertura: 'validacao_google,marketing_conteudo',
  configuracao: { versao: 'versao-original', ativo: false, orcamentoMensalUsd: null, limiteExecucaoUsd: null, reservaTentativaUsd: 0.01, concorrenciaMaxima: null, alertaPercentual: 80, fusoHorario: 'America/Sao_Paulo', destinatarios: [] },
  saldo: { competencia: '2026-11', inicioUtc: '2026-11-01T03:00:00Z', fimUtc: '2026-12-01T03:00:00Z', custoApuradoUsd: 0.00000001, reservadoUsd: 0.01, incertoUsd: 0.02, comprometidoUsd: 0.03000001, disponivelUsd: null, emExecucao: 1, incertas: 1 },
  reservas: [{ tentativaId: 'tentativa-incerta', execucaoId: 'execucao', competencia: '2026-11', status: 3, valorReservadoUsd: 0.02, valorComprometidoUsd: 0.02, iniciadoEmUtc: '2026-11-17T15:00:00Z', concluidoEmUtc: null }], alertas: []
} });

describe('Limites de IA', () => {
  const empresa = signal(1);
  const usuario = signal({ id: 1 });
  const permissoes = signal(['ia_configuracoes:ler', 'ia_configuracoes:editar']);
  let api: { get: jasmine.Spy; put: jasmine.Spy; post: jasmine.Spy };
  let toast: { aviso: jasmine.Spy; erro: jasmine.Spy; erroServidor: jasmine.Spy; sucesso: jasmine.Spy };
  let confirm: { confirmar: jasmine.Spy };

  beforeEach(() => {
    empresa.set(1); usuario.set({ id: 1 }); permissoes.set(['ia_configuracoes:ler', 'ia_configuracoes:editar']);
    api = { get: jasmine.createSpy('get').and.returnValue(of(limiteFixture())), put: jasmine.createSpy('put').and.returnValue(of(limiteFixture())), post: jasmine.createSpy('post').and.returnValue(of(limiteFixture())) };
    toast = { aviso: jasmine.createSpy('aviso'), erro: jasmine.createSpy('erro'), erroServidor: jasmine.createSpy('erroServidor'), sucesso: jasmine.createSpy('sucesso') };
    confirm = { confirmar: jasmine.createSpy('confirmar').and.resolveTo(true) };
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'configuracoes', children: CONFIGURACOES_ROUTES }, { path: 'dashboard', component: ConfiguracoesPaginaComponent }]),
      { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: (chave: string) => permissoes().includes(chave) } },
      { provide: EmpresaFlagsService, useValue: { carregar: () => undefined, tinyAtivo: () => false } },
      { provide: ApiService, useValue: api }, { provide: ToastService, useValue: toast }, { provide: ConfirmService, useValue: confirm }
    ] });
  });

  it('mostra somente a política e os compromissos da empresa atual com cobertura explícita', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    expect(api.get.calls.mostRecent().args).toEqual(['/v1/configuracoes/ia/limites']);
    expect(pagina.form.controls.ativo.value).toBeFalse();
    expect(pagina.moeda(0)).toBe('USD 0,00');
    expect(pagina.moeda(null)).toContain('Sem limite');
    expect(pagina.moeda(0.00000001)).toContain('0,00000001');
    const texto = harness.routeNativeElement?.textContent ?? '';
    expect(texto).toContain('validações Google e geração de textos de marketing');
    expect(texto).toContain('Incerta');
    expect(texto).toContain('tempo decorrido não libera');
    expect([...harness.routeNativeElement!.querySelectorAll('button')].some(botao => botao.textContent?.trim() === 'Filtros')).toBeFalse();
    expect(harness.routeNativeElement!.querySelector('app-listagem-paginada select')).toBeNull();
  });

  it('leitura não autoriza edição nem conciliação e ausência de leitura bloqueia rota e catálogo', async () => {
    permissoes.set(['ia_configuracoes:ler']);
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    expect(pagina.form.disabled).toBeTrue();
    await pagina.salvar();
    pagina.abrirConciliacao(pagina.dados()!.reservas[0]);
    expect(pagina.reservaSelecionada()).toBeNull();
    expect(api.put).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    permissoes.set([]); await harness.fixture.whenStable(); harness.detectChanges();
    expect(pagina.dados()).toBeNull();
    expect(filtrarConfiguracoes(() => false, false).flatMap(grupo => grupo.destinos).some(item => item.id === 'ia-limites')).toBeFalse();
    await harness.fixture.whenStable();
    await harness.navigateByUrl('/dashboard');
    await harness.navigateByUrl('/configuracoes/ia/limites');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('salva versão original, zero explícito, campos nulos e destinatários sem tenant arbitrário', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    pagina.form.patchValue({ ativo: true, orcamentoMensalUsd: 0, limiteExecucaoUsd: null, concorrenciaMaxima: null, destinatarios: ' dona@empresa.com; equipe@empresa.com ' });
    await pagina.salvar();
    const corpo = api.put.calls.mostRecent().args[1];
    expect(corpo).toEqual({ versao: 'versao-original', ativo: true, orcamentoMensalUsd: 0, limiteExecucaoUsd: null, reservaTentativaUsd: 0.01, concorrenciaMaxima: null, alertaPercentual: 80, fusoHorario: 'America/Sao_Paulo', destinatarios: ['dona@empresa.com', 'equipe@empresa.com'] });
    expect(pagina.alterado()).toBeFalse();
  });

  it('recusa limites negativos, concorrência fracionada, fuso inválido e destinatário inválido', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    pagina.form.patchValue({ orcamentoMensalUsd: -1, concorrenciaMaxima: 1.5, fusoHorario: 'fuso-inexistente' });
    await pagina.salvar();
    expect(api.put).not.toHaveBeenCalled();
    pagina.form.patchValue({ orcamentoMensalUsd: null, concorrenciaMaxima: null, fusoHorario: 'America/Sao_Paulo', destinatarios: 'invalido' });
    await pagina.salvar();
    expect(api.put).not.toHaveBeenCalled();
    expect(toast.aviso).toHaveBeenCalled();
  });

  it('somente reserva incerta aceita conciliação com valor explícito e justificativa', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    const reserva = pagina.dados()!.reservas[0];
    pagina.abrirConciliacao({ ...reserva, status: 1 });
    expect(pagina.reservaSelecionada()).toBeNull();
    pagina.abrirConciliacao(reserva);
    expect(pagina.conciliacao.controls.valorApuradoUsd.value).toBeNull();
    await pagina.conciliar();
    expect(api.post).not.toHaveBeenCalled();
    pagina.conciliacao.setValue({ valorApuradoUsd: 0, justificativa: ' Consulta da cobrança confirma ausência de débito. ' });
    await pagina.conciliar();
    expect(api.post.calls.mostRecent().args).toEqual(['/v1/configuracoes/ia/limites/reservas/tentativa-incerta/conciliacao', { valorApuradoUsd: 0, justificativa: 'Consulta da cobrança confirma ausência de débito.' }]);
    expect(pagina.reservaSelecionada()).toBeNull();
  });

  it('cancela consulta e limpa formulário ao trocar empresa', async () => {
    const pendente = new Subject<Resultado<IaLimites>>(); api.get.and.returnValue(pendente);
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    expect(pendente.observed).toBeTrue(); empresa.set(2); await harness.fixture.whenStable(); harness.detectChanges();
    expect(pendente.observed).toBeFalse(); pendente.next(limiteFixture());
    expect(pagina.dados()).toBeNull(); expect(pagina.form.controls.destinatarios.value).toBe('');
  });

  it('cancela ação ao perder edição e descarta confirmação após troca de contexto', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    const pendente = new Subject<Resultado<IaLimites>>(); api.put.and.returnValue(pendente);
    await pagina.salvar(); expect(pendente.observed).toBeTrue();
    permissoes.set(['ia_configuracoes:ler']); await harness.fixture.whenStable(); harness.detectChanges();
    expect(pendente.observed).toBeFalse(); pendente.next(limiteFixture()); expect(toast.sucesso).not.toHaveBeenCalled();
    permissoes.set(['ia_configuracoes:ler', 'ia_configuracoes:editar']); await harness.fixture.whenStable(); harness.detectChanges();
    let resolver!: (valor: boolean) => void;
    confirm.confirmar.and.returnValue(new Promise<boolean>(resolve => { resolver = resolve; }));
    api.put.calls.reset(); const acao = pagina.salvar(); empresa.set(2); await harness.fixture.whenStable(); harness.detectChanges(); resolver(true); await acao;
    expect(api.put).not.toHaveBeenCalled(); expect(pagina.dados()).toBeNull();
  });

  it('indisponível não habilita mutações e falha de versão mantém erro sem anunciar sucesso', async () => {
    const retorno = limiteFixture(); retorno.dados!.habilitado = false; api.get.and.returnValue(of(retorno));
    const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    expect(harness.routeNativeElement?.textContent).toContain('indisponível'); await pagina.salvar(); expect(api.put).not.toHaveBeenCalled();
    api.get.and.returnValue(of(limiteFixture())); pagina.carregar();
    api.put.and.returnValue(throwError(() => new Error('conflito de versão'))); await pagina.salvar();
    expect(toast.erroServidor).toHaveBeenCalled(); expect(toast.sucesso).not.toHaveBeenCalled(); expect(pagina.processando()).toBeFalse();
  });
  it('não transforma zeros técnicos do consumo sem reserva em custo conhecido', async () => {
    const retorno = limiteFixture();
    retorno.dados!.reservas[0] = { ...retorno.dados!.reservas[0], semReserva: true, valorReservadoUsd: 0, valorComprometidoUsd: 0 };
    retorno.dados!.saldo.incertoUsd = 0;
    api.get.and.returnValue(of(retorno));
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    expect(pagina.temValorDesconhecido()).toBeTrue();
    const texto = harness.routeNativeElement?.textContent ?? '';
    expect(texto).toContain('Desconhecido / sem reserva');
    expect(texto).toContain('Valor desconhecido');
    pagina.abrirConciliacao(pagina.dados()!.reservas[0]);
    pagina.conciliacao.setValue({ valorApuradoUsd: 0.03, justificativa: 'Valor comprovado no relatório oficial do provedor.' });
    await pagina.conciliar();
    expect(api.post).toHaveBeenCalled();
  });

  it('recusa mais de dez destinatários e justificativa curta ou com controle', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia/limites', IaLimitesComponent);
    pagina.form.controls.destinatarios.setValue(Array.from({ length: 11 }, (_, indice) => 'pessoa' + indice + '@empresa.com').join(';'));
    await pagina.salvar(); expect(api.put).not.toHaveBeenCalled();
    pagina.abrirConciliacao(pagina.dados()!.reservas[0]);
    pagina.conciliacao.setValue({ valorApuradoUsd: 0, justificativa: 'curta' });
    await pagina.conciliar(); expect(api.post).not.toHaveBeenCalled();
    pagina.conciliacao.setValue({ valorApuradoUsd: 0, justificativa: 'justificativa' + String.fromCharCode(10) + 'com controle' });
    await pagina.conciliar(); expect(api.post).not.toHaveBeenCalled();
  });

});
