import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/feedback/toast.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { Peca, PecaResumo } from './models/peca.model';
import { PecasService } from './services/pecas.service';
import { PecaEditorComponent } from './pages/peca-editor/peca-editor.component';
import { PecasListaComponent } from './pages/pecas-lista/pecas-lista.component';

@Component({ standalone: true, template: '' }) class VazioComponent {}

const versao = '00000000-0000-0000-0000-0000000000aa';

function peca(extra: Partial<Peca> = {}): Peca {
  return {
    id: 5, versao, briefingId: 11, codigoGeracao: null, rede: 'Instagram', formato: 'Carrossel', status: 1, versaoAtual: 1, versaoAprovada: null,
    aprovadaPor: null, aprovadaEm: null, planejadaPara: null, criadoEm: '2026-11-18T12:00:00Z', atualizadoEm: '2026-11-18T12:00:00Z',
    conteudo: { legenda: 'Dicas de beleza escolar', cta: 'Salve o post', hashtags: ['#escola', '#beleza'], ideiaVisual: 'Carrossel colorido', roteiro: ['Slide 1', 'Slide 2'] },
    versoes: [{ numero: 1, origem: 1, usuarioId: 7, criadoEm: '2026-11-18T12:00:00Z' }], alertaValor: false, ...extra
  };
}

const resumo: PecaResumo = { id: 5, versao, briefingId: 11, rede: 'Instagram', formato: 'Carrossel', status: 1, versaoAtual: 1, versaoAprovada: null, aprovadaEm: null, planejadaPara: null, atualizadoEm: '2026-11-18T12:00:00Z', resumo: 'Dicas de beleza escolar' };

describe('Peças de marketing', () => {
  const empresa = signal(1);
  const usuario = signal({ id: 1 });
  const permissoes = signal(['marketing:ler', 'marketing:criar', 'marketing:editar', 'marketing:aprovar']);
  let service: { listar: jasmine.Spy; obter: jasmine.Spy; criar: jasmine.Spy; salvarConteudo: jasmine.Spy; aprovar: jasmine.Spy; arquivar: jasmine.Spy; planejar: jasmine.Spy; exportar: jasmine.Spy };
  let confirm: { confirmar: jasmine.Spy; estado: () => null; responder: jasmine.Spy };

  beforeEach(() => {
    empresa.set(1); usuario.set({ id: 1 }); permissoes.set(['marketing:ler', 'marketing:criar', 'marketing:editar', 'marketing:aprovar']);
    service = {
      listar: jasmine.createSpy('listar').and.returnValue(of({ sucesso: true, dados: { habilitado: true, itens: [resumo] } })),
      obter: jasmine.createSpy('obter').and.returnValue(of({ sucesso: true, dados: peca() })),
      criar: jasmine.createSpy('criar'),
      salvarConteudo: jasmine.createSpy('salvarConteudo').and.callFake((_id: number, conteudo: Peca['conteudo']) => of({ sucesso: true, dados: peca({ versaoAtual: 2, versao: 'nova', conteudo }) })),
      aprovar: jasmine.createSpy('aprovar').and.returnValue(of({ sucesso: true, dados: peca({ status: 2, versaoAprovada: 1, aprovadaEm: '2026-11-18T13:00:00Z' }) })),
      arquivar: jasmine.createSpy('arquivar').and.returnValue(of({ sucesso: true, dados: peca({ status: 3 }) })),
      planejar: jasmine.createSpy('planejar').and.callFake((_id: number, data: string | null) => of({ sucesso: true, dados: peca({ planejadaPara: data, versao: 'planejada' }) })),
      exportar: jasmine.createSpy('exportar').and.returnValue(of({ sucesso: true, dados: { nomeArquivo: 'peca-5-v1.txt', texto: 'Texto' } }))
    };
    confirm = { confirmar: jasmine.createSpy('confirmar').and.resolveTo(true), estado: () => null, responder: jasmine.createSpy('responder') };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'marketing/pecas/:id', component: PecaEditorComponent }, { path: 'marketing/pecas', component: PecasListaComponent }, { path: 'marketing', component: VazioComponent }, { path: 'dashboard', component: VazioComponent }, { path: 'configuracoes', component: VazioComponent }]),
        { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: (chave: string) => permissoes().includes(chave) } },
        { provide: PecasService, useValue: service },
        { provide: ToastService, useValue: { erro: jasmine.createSpy(), erroServidor: jasmine.createSpy(), sucesso: jasmine.createSpy(), aviso: jasmine.createSpy() } },
        { provide: ConfirmService, useValue: confirm }
      ]
    });
  });

  it('lista mostra as peças com link para abrir', async () => {
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/marketing/pecas', PecasListaComponent);
    h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('Dicas de beleza escolar');
    expect(h.routeNativeElement!.querySelector('a[href="/marketing/pecas/5"]')).not.toBeNull();
  });

  it('lista informa indisponibilidade quando o servidor desliga marketing', async () => {
    service.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: false, itens: [] } }));
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/marketing/pecas', PecasListaComponent);
    h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('indisponíveis');
  });

  it('editor carrega o texto e só habilita salvar depois de alterar', async () => {
    const h = await RouterTestingHarness.create();
    const pagina = await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    h.detectChanges();
    expect(pagina.form.controls.legenda.value).toBe('Dicas de beleza escolar');
    expect(pagina.form.controls.hashtags.value).toBe('#escola #beleza');
    expect(pagina.roteiro.length).toBe(2);
    const salvar = Array.from<HTMLButtonElement>(h.routeNativeElement!.querySelectorAll('button')).find(b => b.textContent?.includes('Salvar nova versão'))!;
    expect(salvar.disabled).toBeTrue();
  });

  it('salvar envia o conteúdo normalizado com a versão esperada', async () => {
    const h = await RouterTestingHarness.create();
    const pagina = await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    pagina.form.patchValue({ legenda: '  Legenda nova  ', hashtags: '#a   #b' });
    pagina.roteiro.at(1).setValue('Slide 2 revisado');
    pagina.salvar();
    expect(service.salvarConteudo).toHaveBeenCalledWith(5, { legenda: 'Legenda nova', cta: 'Salve o post', hashtags: ['#a', '#b'], ideiaVisual: 'Carrossel colorido', roteiro: ['Slide 1', 'Slide 2 revisado'] }, versao);
    expect(pagina.peca()!.versaoAtual).toBe(2);
  });

  it('não salva legenda vazia', async () => {
    const h = await RouterTestingHarness.create();
    const pagina = await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    pagina.form.patchValue({ legenda: '' });
    pagina.salvar();
    expect(service.salvarConteudo).not.toHaveBeenCalled();
  });

  it('aprova a versão atual depois da confirmação e libera exportar', async () => {
    const h = await RouterTestingHarness.create();
    const pagina = await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    await pagina.aprovar();
    expect(confirm.confirmar).toHaveBeenCalled();
    expect(service.aprovar).toHaveBeenCalledWith(5, versao, 1);
    h.detectChanges();
    const textos = Array.from<HTMLButtonElement>(h.routeNativeElement!.querySelectorAll('button')).map(b => b.textContent?.trim());
    expect(textos).toContain('Exportar texto');
    pagina.exportar();
    expect(service.exportar).toHaveBeenCalledWith(5);
  });

  it('não aprova com alterações não salvas nem sem permissão de aprovar', async () => {
    const h = await RouterTestingHarness.create();
    const pagina = await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    pagina.alterado.set(true);
    await pagina.aprovar();
    expect(service.aprovar).not.toHaveBeenCalled();
    pagina.alterado.set(false);
    permissoes.set(['marketing:ler', 'marketing:editar']);
    await pagina.aprovar();
    expect(service.aprovar).not.toHaveBeenCalled();
    h.detectChanges();
    const textos = Array.from<HTMLButtonElement>(h.routeNativeElement!.querySelectorAll('button')).map(b => b.textContent?.trim());
    expect(textos.some(t => t?.startsWith('Aprovar'))).toBeFalse();
  });

  it('peça arquivada fica somente leitura', async () => {
    service.obter.and.returnValue(of({ sucesso: true, dados: peca({ status: 3 }) }));
    const h = await RouterTestingHarness.create();
    const pagina = await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    h.detectChanges();
    expect(pagina.form.disabled).toBeTrue();
    expect(h.routeNativeElement!.textContent).toContain('arquivada');
    pagina.salvarData();
    expect(service.planejar).not.toHaveBeenCalled();
  });

  it('salvar data envia ISO e não recarrega o texto em edição', async () => {
    const h = await RouterTestingHarness.create();
    const pagina = await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    pagina.form.patchValue({ legenda: 'Texto ainda não salvo' });
    pagina.dataPrevista.setValue('2026-12-01T10:30');
    pagina.salvarData();
    const enviado = service.planejar.calls.mostRecent().args[1] as string;
    expect(new Date(enviado).getTime()).toBe(new Date('2026-12-01T10:30').getTime());
    expect(pagina.form.controls.legenda.value).toBe('Texto ainda não salvo');
    pagina.dataPrevista.setValue('');
    pagina.salvarData();
    expect(service.planejar.calls.mostRecent().args[1]).toBeNull();
  });

  it('alerta de valor aparece quando o servidor sinaliza', async () => {
    service.obter.and.returnValue(of({ sucesso: true, dados: peca({ alertaValor: true }) }));
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('valor em dinheiro');
  });

  it('perder o contexto da empresa sai da tela', async () => {
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/marketing/pecas/5', PecaEditorComponent);
    empresa.set(2);
    await h.fixture.whenStable();
    h.detectChanges();
    await h.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/configuracoes');
  });
});
