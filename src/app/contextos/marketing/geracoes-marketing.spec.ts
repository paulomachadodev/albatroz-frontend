import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { permissaoGuard } from '../../core/auth/permissao.guard';
import { ToastService } from '../../core/feedback/toast.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { Resultado } from '../../core/models';
import { GeracoesBriefingComponent } from './pages/geracoes-briefing/geracoes-briefing.component';
import { GeracoesMarketingService } from './services/geracoes-marketing.service';
import { GeracaoMarketing, GeracaoMarketingLista } from './models/geracao-marketing.model';
import { Briefing } from './models/marketing.model';

@Component({ standalone: true, template: '' })
class PaginaTesteComponent {}

function geracao(status = 3): GeracaoMarketing {
  return { id: '00000000-0000-0000-0000-000000000001', briefingId: 11, status, criadoEmUtc: '2026-11-18T12:00:00Z', atualizadoEmUtc: '2026-11-18T12:00:00Z', marcaVersao: 'marca-congelada', estrategiaVersao: 'estrategia-congelada', briefingVersao: 'briefing-congelado', erro: null, resultado: status === 3 ? { legenda: '<script>conteúdo literal</script>', cta: 'Conheça a empresa', hashtags: ['#ideias'], ideiaVisual: 'Usar imagem autorizada', roteiro: ['Apresentar a ideia', 'Convidar para conhecer'] } : null };
}

const briefing: Briefing = { id: 11, status: 2, versao: 'briefing-congelado', assunto: 'Apresentação dos serviços', objetivo: 'Reconhecimento', publico: '', linha: '', produtoServico: '', oferta: '', formato: 'Post', rede: 'Instagram', referencias: '', prazo: null, criadoEm: '2026-11-18T12:00:00Z', atualizadoEm: '2026-11-18T12:00:00Z' };

describe('Geração de texto Marketing', () => {
  const empresa = signal(1);
  const usuario = signal({ id: 1 });
  const permissoes = signal(['marketing:ler', 'marketing:criar', 'marketing:editar']);
  let service: { obterBriefing: jasmine.Spy; listar: jasmine.Spy; obter: jasmine.Spy; gerar: jasmine.Spy; cancelar: jasmine.Spy };
  let toast: { erro: jasmine.Spy; erroServidor: jasmine.Spy };
  let confirm: { confirmar: jasmine.Spy; estado: () => null; responder: jasmine.Spy };

  beforeEach(() => {
    empresa.set(1); usuario.set({ id: 1 }); permissoes.set(['marketing:ler', 'marketing:criar', 'marketing:editar']);
    service = { obterBriefing: jasmine.createSpy('briefing').and.returnValue(of({ sucesso: true, dados: briefing })), listar: jasmine.createSpy('listar').and.returnValue(of({ sucesso: true, dados: { habilitado: true, itens: [geracao()] } })), obter: jasmine.createSpy('obter').and.returnValue(of({ sucesso: true, dados: geracao() })), gerar: jasmine.createSpy('gerar').and.returnValue(of({ sucesso: true, dados: geracao() })), cancelar: jasmine.createSpy('cancelar').and.returnValue(of({ sucesso: true, dados: geracao(5) })) };
    toast = { erro: jasmine.createSpy('erro'), erroServidor: jasmine.createSpy('erroServidor') };
    confirm = { confirmar: jasmine.createSpy('confirmar').and.resolveTo(true), estado: () => null, responder: jasmine.createSpy('responder') };
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'marketing/briefings/:id/geracoes', component: GeracoesBriefingComponent, canActivate: [permissaoGuard], data: { permissao: 'marketing:ler' } }, { path: 'marketing/briefings', component: PaginaTesteComponent }, { path: 'dashboard', component: PaginaTesteComponent }]),
      { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: (chave: string) => permissoes().includes(chave) } },
      { provide: GeracoesMarketingService, useValue: service }, { provide: ToastService, useValue: toast }, { provide: ConfirmService, useValue: confirm }
    ] });
  });

  it('mostra rascunho literal, versões congeladas e consulta detalhe sem executar conteúdo', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    const texto = harness.routeNativeElement?.textContent ?? '';
    expect(texto).toContain('Rascunho para revisão humana');
    expect(texto).toContain('<script>conteúdo literal</script>');
    expect(harness.routeNativeElement?.querySelector('script')).toBeNull();
    expect(texto).toContain('marca-congelada'); expect(texto).toContain('Apresentação dos serviços');
    pagina.selecionar(geracao()); expect(service.obter).toHaveBeenCalledWith(geracao().id);
    expect(service.gerar).not.toHaveBeenCalled();
  });

  it('reaproveita UUID após erro de transporte e usa novo UUID apenas em nova geração explícita', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    service.gerar.and.returnValues(throwError(() => new Error('timeout')), of({ sucesso: true, dados: geracao() }), of({ sucesso: true, dados: geracao() }));
    await pagina.gerar(); const chave = service.gerar.calls.first().args[1];
    expect(chave).toMatch(/^[a-f0-9-]{36}$/); expect(pagina.retomavel()).toBeTrue(); expect(service.gerar).toHaveBeenCalledTimes(1);
    expect(confirm.confirmar.calls.first().args[1]).toContain('chave Google da empresa atual');
    expect(confirm.confirmar.calls.first().args[1]).toContain('limites ativa');
    await pagina.gerar(); expect(service.gerar.calls.mostRecent().args).toEqual([11, chave]); expect(pagina.retomavel()).toBeFalse();
    await pagina.gerar(); expect(service.gerar.calls.mostRecent().args[1]).not.toBe(chave);
  });

  it('impede clique duplo e cancela respostas de outra empresa', async () => {
    const pendente = new Subject<Resultado<GeracaoMarketing>>(); service.gerar.and.returnValue(pendente);
    const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    await pagina.gerar(); await pagina.gerar(); expect(service.gerar).toHaveBeenCalledTimes(1);
    empresa.set(2); await harness.fixture.whenStable(); harness.detectChanges();
    expect(pendente.observed).toBeFalse(); pendente.next({ sucesso: true, dados: geracao() });
    expect(pagina.itens()).toEqual([]); expect(pagina.selecionada()).toBeNull(); expect(pagina.briefing()).toBeNull();
  });

  it('descarta confirmação ao perder criação ou destruir a página', async () => {
    let resolver!: (valor: boolean) => void;
    confirm.confirmar.and.returnValue(new Promise<boolean>(resolve => { resolver = resolve; }));
    const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    const chamada = pagina.gerar(); permissoes.set(['marketing:ler', 'marketing:editar']); await harness.fixture.whenStable(); harness.detectChanges(); resolver(true); await chamada;
    expect(service.gerar).not.toHaveBeenCalled(); expect(pagina.processando()).toBeFalse();
    permissoes.set(['marketing:ler', 'marketing:criar', 'marketing:editar']); await harness.fixture.whenStable(); harness.detectChanges();
    confirm.confirmar.and.returnValue(new Promise<boolean>(resolve => { resolver = resolve; })); const segunda = pagina.gerar();
    await harness.navigateByUrl('/dashboard'); resolver(true); await segunda; expect(service.gerar).not.toHaveBeenCalled();
  });

  it('permite cancelar somente Pendente e respeita resultado real em corrida com o worker', async () => {
    const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    pagina.selecionada.set(geracao(2)); await pagina.cancelar(); expect(service.cancelar).not.toHaveBeenCalled();
    pagina.selecionada.set(geracao(1)); service.cancelar.and.returnValue(of({ sucesso: true, dados: geracao(2) }));
    await pagina.cancelar(); expect(service.cancelar).toHaveBeenCalledWith(geracao().id); expect(pagina.selecionada()?.status).toBe(2);
  });

  it('não gera para briefing não confirmado, indisponibilidade ou usuário somente leitura', async () => {
    service.obterBriefing.and.returnValue(of({ sucesso: true, dados: { ...briefing, status: 1 } }));
    const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    await pagina.gerar(); expect(service.gerar).not.toHaveBeenCalled();
    service.obterBriefing.and.returnValue(of({ sucesso: true, dados: briefing })); service.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: false, itens: [] } })); pagina.carregar();
    expect(pagina.habilitado()).toBeFalse(); await pagina.gerar(); expect(service.gerar).not.toHaveBeenCalled();
    permissoes.set(['marketing:ler']); await harness.fixture.whenStable(); harness.detectChanges(); await pagina.gerar(); await pagina.cancelar();
    expect(service.gerar).not.toHaveBeenCalled(); expect(service.cancelar).not.toHaveBeenCalled();
  });

  it('cancela polling ao concluir e ao destruir a página, sem repetir POST', fakeAsync(() => {
    const parametros = convertToParamMap({ id: '11' });
    TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { paramMap: parametros }, paramMap: of(parametros) } });
    service.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: true, itens: [geracao(1)] } })); service.obter.and.returnValue(of({ sucesso: true, dados: geracao(1) }));
    const fixture = TestBed.createComponent(GeracoesBriefingComponent); fixture.detectChanges();
    tick(3000); expect(service.listar).toHaveBeenCalledTimes(2);
    service.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: true, itens: [geracao(3)] } })); service.obter.and.returnValue(of({ sucesso: true, dados: geracao(3) }));
    tick(3000); expect(fixture.componentInstance.selecionada()?.status).toBe(3); const chamadas = service.listar.calls.count(); tick(6000); expect(service.listar.calls.count()).toBe(chamadas);
    service.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: true, itens: [geracao(1)] } })); fixture.componentInstance.carregar(); fixture.destroy();
    const antes = service.listar.calls.count(); tick(6000); expect(service.listar.calls.count()).toBe(antes); expect(service.gerar).not.toHaveBeenCalled();
  }));

  it('limpa leitura pendente ao perder acesso e nega rota sem permissão', async () => {
    const pendente = new Subject<Resultado<GeracaoMarketingLista>>(); service.listar.and.returnValue(pendente);
    const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    expect(pendente.observed).toBeTrue(); permissoes.set([]); await harness.fixture.whenStable(); harness.detectChanges();
    expect(pendente.observed).toBeFalse(); expect(pagina.itens()).toEqual([]);
    pendente.next({ sucesso: true, dados: { habilitado: true, itens: [geracao()] } }); expect(pagina.selecionada()).toBeNull();
  });
  it('fecha a confirmação própria e não cria execução ao trocar empresa', async () => {
    const confirmacaoReal = new ConfirmService();
    TestBed.overrideProvider(ConfirmService, { useValue: confirmacaoReal });
    const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    const chamada = pagina.gerar(); expect(confirmacaoReal.estado()).not.toBeNull();
    empresa.set(2); await harness.fixture.whenStable(); harness.detectChanges(); await chamada;
    expect(confirmacaoReal.estado()).toBeNull(); expect(service.gerar).not.toHaveBeenCalled();
  });

  it('perder criação não interrompe cancelamento autorizado por edição', async () => {
    const pendente = new Subject<Resultado<GeracaoMarketing>>(); service.cancelar.and.returnValue(pendente);
    const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
    pagina.selecionada.set(geracao(1)); await pagina.cancelar(); expect(pendente.observed).toBeTrue();
    permissoes.set(['marketing:ler', 'marketing:editar']); await harness.fixture.whenStable(); harness.detectChanges();
    expect(pendente.observed).toBeTrue(); pendente.next({ sucesso: true, dados: geracao(5) });
    expect(pagina.selecionada()?.status).toBe(5); expect(service.gerar).not.toHaveBeenCalled();
  });

  it('gera UUID seguro mesmo no acesso HTTP local sem randomUUID disponível', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const harness = await RouterTestingHarness.create(); const pagina = await harness.navigateByUrl('/marketing/briefings/11/geracoes', GeracoesBriefingComponent);
      await pagina.gerar();
      expect(service.gerar.calls.first().args[1]).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    } finally {
      if (descriptor) Object.defineProperty(crypto, 'randomUUID', descriptor);
      else Reflect.deleteProperty(crypto, 'randomUUID');
    }
  });

});
