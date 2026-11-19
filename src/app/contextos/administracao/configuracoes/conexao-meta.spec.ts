import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/feedback/toast.service';
import { ConexaoMetaComponent } from './pages/configuracoes-pagina/conexao-meta.component';
import { RetornoRedesSociaisComponent } from './pages/configuracoes-pagina/retorno-redes-sociais.component';

@Component({ standalone: true, template: '' }) class VazioComponent {}

const versao = '00000000-0000-0000-0000-000000000001';
const aplicativo = { habilitado: true, configurado: true, appId: '12345678', configId: null, segredoConfigurado: true, versao, uriRetorno: 'https://erp.exemplo/marketing/redes-sociais/retorno', escoposSolicitados: ['pages_show_list'] };
const conexao = {
  id: 1, versao, provedor: 1, idExterno: 'u1', nome: 'Paulo', situacao: 2, escoposConcedidos: ['pages_show_list'], escoposAusentes: ['instagram_basic'],
  expiraEm: null, validadaEm: '2026-11-18T12:00:00Z', criadoEm: '2026-11-18T12:00:00Z',
  ativos: [{ id: 10, tipo: 1, idExterno: 'p1', nome: 'Albatroz', usuario: null, idExternoPagina: null, selecionado: false }, { id: 11, tipo: 2, idExterno: 'i1', nome: 'Albatroz IG', usuario: 'albatroz', idExternoPagina: 'p1', selecionado: false }]
};

describe('Conexão Meta', () => {
  const permissoes = signal(['integracoes_sociais:ler', 'integracoes_sociais:criar', 'integracoes_sociais:editar', 'integracoes_sociais:excluir']);
  let api: { get: jasmine.Spy; put: jasmine.Spy; post: jasmine.Spy; delete: jasmine.Spy };
  let toast: { erro: jasmine.Spy; erroServidor: jasmine.Spy; sucesso: jasmine.Spy; aviso: jasmine.Spy; mensagemServidor: jasmine.Spy };

  beforeEach(() => {
    permissoes.set(['integracoes_sociais:ler', 'integracoes_sociais:criar', 'integracoes_sociais:editar', 'integracoes_sociais:excluir']);
    api = {
      get: jasmine.createSpy('get').and.callFake((path: string) => path.endsWith('/aplicativo')
        ? of({ sucesso: true, dados: aplicativo })
        : of({ sucesso: true, dados: { habilitado: true, conexao } })),
      put: jasmine.createSpy('put').and.returnValue(of({ sucesso: true, dados: aplicativo })),
      post: jasmine.createSpy('post').and.returnValue(of({ sucesso: true, dados: { urlAutorizacao: 'https://outro.exemplo/', expiraEm: '2026-11-18T12:10:00Z' } })),
      delete: jasmine.createSpy('delete').and.returnValue(of({ sucesso: true }))
    };
    toast = { erro: jasmine.createSpy(), erroServidor: jasmine.createSpy(), sucesso: jasmine.createSpy(), aviso: jasmine.createSpy(), mensagemServidor: jasmine.createSpy().and.returnValue('Mensagem do servidor') };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'configuracoes/redes-sociais', component: VazioComponent }]),
        { provide: AuthService, useValue: { usuario: signal({ id: 1 }), empresaIdAtual: () => 1, temPermissao: (chave: string) => permissoes().includes(chave) } },
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast }
      ]
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(ConexaoMetaComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('nunca preenche o segredo e salva sem enviá-lo quando em branco', () => {
    const fixture = montar();
    fixture.componentInstance.editandoApp.set(true);
    fixture.detectChanges();
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('#meta-app-secret');
    expect(campo.value).toBe('');
    expect(campo.placeholder).toContain('Deixe em branco');
    fixture.componentInstance.salvarAplicativo();
    expect(api.put).toHaveBeenCalledWith('/v1/integracoes-sociais/meta/aplicativo', { appId: '12345678', appSecret: null, configId: null, versaoEsperada: versao });
  });

  it('limpa o segredo digitado depois de salvar', () => {
    const fixture = montar();
    fixture.componentInstance.form.patchValue({ appSecret: 'abcdefghijklmnop1234' });
    fixture.componentInstance.salvarAplicativo();
    expect(api.put.calls.mostRecent().args[1].appSecret).toBe('abcdefghijklmnop1234');
    expect(fixture.componentInstance.form.controls.appSecret.value).toBe('');
  });

  it('recusa endereço de autorização fora do domínio da Meta', () => {
    const fixture = montar();
    fixture.componentInstance.conectar();
    expect(api.post).toHaveBeenCalledWith('/v1/integracoes-sociais/meta/conexao/iniciar', {});
    expect(toast.erro).toHaveBeenCalled();
    expect(fixture.componentInstance.ocupado()).toBeFalse();
  });

  it('esconde conectar e desconectar sem as permissões', () => {
    permissoes.set(['integracoes_sociais:ler']);
    const fixture = montar();
    const textos = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).map(b => b.textContent?.trim());
    expect(textos).not.toContain('Reconectar');
    expect(textos).not.toContain('Desconectar');
    expect(textos).not.toContain('Salvar aplicativo');
    fixture.componentInstance.conectar();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('avisa autorização parcial e salva a seleção de ativos com a versão vigente', () => {
    const fixture = montar();
    expect(fixture.nativeElement.textContent).toContain('Faltou conceder algumas permissões');
    expect(fixture.componentInstance.selecaoAlterada()).toBeFalse();
    fixture.componentInstance.alternar(11);
    expect(fixture.componentInstance.selecaoAlterada()).toBeTrue();
    fixture.componentInstance.salvarSelecao();
    expect(api.put).toHaveBeenCalledWith('/v1/integracoes-sociais/meta/conexao/ativos', { ativoIds: [11], versaoEsperada: versao });
  });

  it('desconecta e limpa a conexão exibida', () => {
    const fixture = montar();
    fixture.componentInstance.desconectar();
    expect(api.delete).toHaveBeenCalledWith('/v1/integracoes-sociais/meta/conexao');
    expect(fixture.componentInstance.conexao()).toBeNull();
  });

  it('mostra indisponível quando o servidor não habilita a conexão', () => {
    api.get.and.callFake((path: string) => path.endsWith('/aplicativo')
      ? of({ sucesso: true, dados: { ...aplicativo, habilitado: false } })
      : of({ sucesso: true, dados: { habilitado: false, conexao: null } }));
    const fixture = montar();
    expect(fixture.nativeElement.textContent).toContain('indisponível');
    expect(fixture.nativeElement.querySelector('#meta-app-secret')).toBeNull();
  });
});

describe('Retorno da Meta', () => {
  let api: { post: jasmine.Spy };
  let toast: { sucesso: jasmine.Spy; mensagemServidor: jasmine.Spy };

  beforeEach(() => {
    api = { post: jasmine.createSpy('post').and.returnValue(of({ sucesso: true, dados: conexao })) };
    toast = { sucesso: jasmine.createSpy(), mensagemServidor: jasmine.createSpy().and.returnValue('A autorização expirou.') };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'retorno', component: RetornoRedesSociaisComponent }, { path: 'configuracoes/redes-sociais', component: VazioComponent }]),
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast }
      ]
    });
  });

  it('conclui a conexão com code e state e volta para Redes sociais sem manter a query', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/retorno?code=abc&state=xyz');
    await harness.fixture.whenStable();
    expect(api.post).toHaveBeenCalledWith('/v1/integracoes-sociais/meta/conexao/concluir', { codigo: 'abc', state: 'xyz', erroProvedor: null });
    expect(toast.sucesso).toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/configuracoes/redes-sociais');
  });

  it('sem state não chama a API e mostra o erro', async () => {
    const harness = await RouterTestingHarness.create();
    const componente = await harness.navigateByUrl('/retorno?code=abc', RetornoRedesSociaisComponent);
    expect(api.post).not.toHaveBeenCalled();
    expect(componente.erro()).toContain('Inicie a conexão novamente');
  });

  it('mostra o erro do servidor quando a conclusão falha', async () => {
    api.post.and.returnValue(throwError(() => new Error('falha')));
    const harness = await RouterTestingHarness.create();
    const componente = await harness.navigateByUrl('/retorno?code=abc&state=xyz', RetornoRedesSociaisComponent);
    expect(componente.erro()).toBe('A autorização expirou.');
  });

  it('repassa a recusa do consentimento ao servidor', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/retorno?error=access_denied&state=xyz');
    expect(api.post).toHaveBeenCalledWith('/v1/integracoes-sociais/meta/conexao/concluir', { codigo: null, state: 'xyz', erroProvedor: 'access_denied' });
  });
});
