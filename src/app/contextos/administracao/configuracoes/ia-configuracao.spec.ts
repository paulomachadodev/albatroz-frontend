import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { EmpresaFlagsService } from '../../../core/empresa/empresa-flags.service';
import { ApiService } from '../../../core/http/api.service';
import { ConfirmService } from '../../../core/feedback/confirm.service';
import { CONFIGURACOES_ROUTES } from './configuracoes.routes';
import { IaConfiguracaoComponent } from './pages/configuracoes-pagina/ia-configuracao.component';
import { ConfiguracoesPaginaComponent } from './pages/configuracoes-pagina/configuracoes-pagina.component';
import { IaConfiguracaoResultado } from './models/ia-configuracao.model';

describe('Configuração isolada de IA', () => {
  const permissoes = signal<string[]>([]);
  let api: { get: jasmine.Spy; put: jasmine.Spy; delete: jasmine.Spy };
  const empresa = signal(99);
  const usuario = signal({ id: 99 });
  const resposta = (habilitado = true): IaConfiguracaoResultado => ({ sucesso: true, dados: { habilitado, configurada: true, modelo: 'gemini-2.5-flash-lite', marcador: '***1234', versao: 'v1', validadoEm: null, fluxosAtuaisMigrados: false } });

  beforeEach(() => {
    permissoes.set(['ia_configuracoes:ler', 'ia_configuracoes:editar', 'ia_configuracoes:excluir']);
    empresa.set(99);
    api = { get: jasmine.createSpy('get').and.returnValue(of(resposta())), put: jasmine.createSpy('put').and.returnValue(of(resposta())), delete: jasmine.createSpy('delete').and.returnValue(of(resposta())) };
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'configuracoes', children: CONFIGURACOES_ROUTES }, { path: 'dashboard', component: ConfiguracoesPaginaComponent }]),
      { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: (p: string) => permissoes().includes(p) } },
      { provide: EmpresaFlagsService, useValue: { carregar: () => undefined, tinyAtivo: () => false } },
      { provide: ApiService, useValue: api }
    ] });
  });

  it('abre sem validar nem retornar chave e respeita PBAC específico', async () => {
    const harness = await RouterTestingHarness.create('/configuracoes');
    expect(harness.routeNativeElement?.textContent).toContain('Inteligência artificial');
    const pagina = await harness.navigateByUrl('/configuracoes/ia', IaConfiguracaoComponent);
    expect(pagina.form.controls.chave.value).toBe('');
    pagina.form.controls.chave.setValue('curta');
    expect(pagina.form.controls.chave.invalid).toBeTrue();
    pagina.form.controls.modelo.setValue('gemini-MAIUSCULO');
    expect(pagina.form.controls.modelo.invalid).toBeTrue();
    pagina.form.reset({ chave: '', modelo: 'gemini-2.5-flash-lite' });
    expect(api.put).not.toHaveBeenCalled();
    expect(harness.routeNativeElement?.textContent).toContain('não troca os fluxos');
    permissoes.set(['configuracoes:ler']);
    await harness.navigateByUrl('/configuracoes');
    await harness.navigateByUrl('/configuracoes/ia');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('não permite mutações enquanto implantação estiver pendente', async () => {
    api.get.and.returnValue(of(resposta(false)));
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia', IaConfiguracaoComponent);
    pagina.form.setValue({ chave: 'ChaveGoogleSomenteParaTeste123456', modelo: 'gemini-2.5-flash-lite' });
    await pagina.salvar();
    await pagina.remover();
    expect(api.put).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
    expect(harness.routeNativeElement?.textContent).toContain('Implantação pendente');
  });

  it('confirma chamada faturável, salva somente endpoint dedicado e limpa segredo', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia', IaConfiguracaoComponent);
    const confirm = spyOn(TestBed.inject(ConfirmService), 'confirmar').and.resolveTo(true);
    pagina.form.setValue({ chave: 'ChaveGoogleSomenteParaTeste123456', modelo: 'gemini-2.5-flash-lite' });
    pagina.registrarAlteracao();
    await pagina.salvar();
    expect(confirm.calls.mostRecent().args[1]).toContain('cobrança');
    expect(api.put).toHaveBeenCalledOnceWith('/v1/configuracoes/ia', { chave: 'ChaveGoogleSomenteParaTeste123456', modelo: 'gemini-2.5-flash-lite' });
    expect(pagina.form.controls.chave.value).toBe('');
    expect(pagina.alterado()).toBeFalse();
  });

  it('preserva configuração anterior quando validação falha', async () => {
    api.put.and.returnValue(throwError(() => new Error('falha')));
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia', IaConfiguracaoComponent);
    spyOn(TestBed.inject(ConfirmService), 'confirmar').and.resolveTo(true);
    pagina.form.controls.chave.setValue('ChaveGoogleSomenteParaTeste123456');
    await pagina.salvar();
    expect(pagina.configuracao()?.versao).toBe('v1');
    expect(pagina.form.controls.chave.value).toBe('');
    expect(pagina.processando()).toBeFalse();
  });

  it('exige permissão de exclusão e revalida contexto após confirmação', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia', IaConfiguracaoComponent);
    permissoes.set(['ia_configuracoes:ler']);
    await pagina.remover();
    expect(api.delete).not.toHaveBeenCalled();
    permissoes.set(['ia_configuracoes:ler', 'ia_configuracoes:editar']);
    const confirmar = spyOn(TestBed.inject(ConfirmService), 'confirmar').and.callFake(async () => { empresa.set(100); return true; });
    pagina.form.controls.chave.setValue('ChaveGoogleSomenteParaTeste123456');
    await pagina.salvar();
    TestBed.tick();
    await harness.fixture.whenStable();
    expect(confirmar).toHaveBeenCalled();
    expect(api.put).not.toHaveBeenCalled();
    expect(pagina.form.controls.chave.value).toBe('');
    expect(TestBed.inject(Router).url).toBe('/configuracoes');
  });

  it('remove somente após confirmação com permissão própria', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia', IaConfiguracaoComponent);
    const confirmar = spyOn(TestBed.inject(ConfirmService), 'confirmar').and.resolveTo(false);
    await pagina.remover();
    expect(api.delete).not.toHaveBeenCalled();
    confirmar.and.resolveTo(true);
    api.delete.and.returnValue(of({ sucesso: true, dados: { ...resposta().dados!, configurada: false, marcador: null } }));
    await pagina.remover();
    expect(api.delete).toHaveBeenCalledOnceWith('/v1/configuracoes/ia');
    expect(pagina.configuracao()?.configurada).toBeFalse();
  });

  it('descarta resposta da sessão anterior durante troca de empresa', async () => {
    const pendente = new Subject<IaConfiguracaoResultado>();
    api.get.and.returnValue(pendente);
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/ia', IaConfiguracaoComponent);
    empresa.set(100);
    TestBed.tick();
    await harness.fixture.whenStable();
    pendente.next(resposta());
    expect(pagina.configuracao()).toBeNull();
  });
});
