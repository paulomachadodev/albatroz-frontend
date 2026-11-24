import { Component, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmService } from '../../../core/feedback/confirm.service';
import { ToastService } from '../../../core/feedback/toast.service';
import { ApiService } from '../../../core/http/api.service';
import { MercadoLivreConfiguracaoComponent } from './pages/configuracoes-pagina/mercado-livre-configuracao.component';

@Component({ standalone: true, template: '' }) class VazioComponent {}

const versao = '00000000-0000-0000-0000-000000000001';
const semAplicativo = { habilitado: true, aplicativoConfigurado: false, appId: null, versao: null, uriRetorno: 'https://erp.exemplo/configuracoes/mercado-livre', conexao: null };
const comAplicativo = { ...semAplicativo, aplicativoConfigurado: true, appId: '1234567890', versao };
const conexao = { versao, idExterno: '99', nome: 'ALBATROZ', situacao: 1, expiraEm: '2026-11-25T12:00:00Z', validadaEm: '2026-11-24T12:00:00Z' };
const todas = ['integracoes_marketplace:ler', 'integracoes_marketplace:criar', 'integracoes_marketplace:editar', 'integracoes_marketplace:excluir'];

describe('Configuração do Mercado Livre', () => {
  const permissoes = signal<string[]>(todas);
  let api: { get: jasmine.Spy; put: jasmine.Spy; post: jasmine.Spy; delete: jasmine.Spy };
  let toast: { erro: jasmine.Spy; erroServidor: jasmine.Spy; sucesso: jasmine.Spy; aviso: jasmine.Spy; mensagemServidor: jasmine.Spy };
  let confirmacao: { confirmar: jasmine.Spy };
  let consulta: Record<string, string>;

  beforeEach(() => {
    permissoes.set(todas);
    consulta = {};
    api = {
      get: jasmine.createSpy('get').and.returnValue(of({ sucesso: true, dados: comAplicativo })),
      put: jasmine.createSpy('put').and.returnValue(of({ sucesso: true, dados: comAplicativo })),
      post: jasmine.createSpy('post').and.returnValue(of({ sucesso: true, dados: { mensagem: 'Credenciais aceitas pelo Mercado Livre.' } })),
      delete: jasmine.createSpy('delete').and.returnValue(of({ sucesso: true }))
    };
    toast = { erro: jasmine.createSpy(), erroServidor: jasmine.createSpy(), sucesso: jasmine.createSpy(), aviso: jasmine.createSpy(), mensagemServidor: jasmine.createSpy().and.returnValue('Mensagem do servidor') };
    confirmacao = { confirmar: jasmine.createSpy('confirmar').and.resolveTo(true) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'configuracoes/mercado-livre', component: VazioComponent }]),
        { provide: AuthService, useValue: { usuario: signal({ id: 1 }), empresaIdAtual: () => 1, temPermissao: (chave: string) => permissoes().includes(chave) } },
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: ConfirmService, useValue: confirmacao },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (chave: string) => consulta[chave] ?? null } } } }
      ]
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(MercadoLivreConfiguracaoComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('mostra o formulário de credenciais quando ainda não há aplicativo', () => {
    api.get.and.returnValue(of({ sucesso: true, dados: semAplicativo }));
    const fixture = montar();
    expect(fixture.nativeElement.querySelector('#ml-app-id')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Não conectado');
    expect(fixture.nativeElement.textContent).not.toContain('Conectar conta do Mercado Livre');
  });

  it('exige a Secret Key no primeiro cadastro', () => {
    api.get.and.returnValue(of({ sucesso: true, dados: semAplicativo }));
    const fixture = montar();
    fixture.componentInstance.form.patchValue({ appId: '1234567890' });
    fixture.componentInstance.salvarAplicativo();
    expect(api.put).not.toHaveBeenCalled();
    expect(toast.aviso).toHaveBeenCalled();
  });

  it('nunca preenche o segredo e salva sem enviá-lo quando em branco', () => {
    const fixture = montar();
    fixture.componentInstance.editandoApp.set(true);
    fixture.detectChanges();
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('#ml-secret');
    expect(campo.value).toBe('');
    expect(campo.placeholder).toContain('Deixe em branco');
    fixture.componentInstance.salvarAplicativo();
    expect(api.put).toHaveBeenCalledWith('/v1/integracoes-marketplace/mercado-livre/aplicativo', { appId: '1234567890', clientSecret: null, versaoEsperada: versao });
  });

  it('limpa o segredo digitado depois de salvar', () => {
    const fixture = montar();
    fixture.componentInstance.form.patchValue({ clientSecret: 'abcdefghijklmnop1234' });
    fixture.componentInstance.salvarAplicativo();
    expect(api.put.calls.mostRecent().args[1].clientSecret).toBe('abcdefghijklmnop1234');
    expect(fixture.componentInstance.form.controls.clientSecret.value).toBe('');
  });

  it('oferece conectar quando há credenciais e nenhuma conta', () => {
    const fixture = montar();
    expect(fixture.nativeElement.textContent).toContain('Conectar conta do Mercado Livre');
    expect(fixture.nativeElement.textContent).toContain('Credenciais salvas');
  });

  it('recusa endereço de autorização fora do Mercado Livre', () => {
    api.post.and.returnValue(of({ sucesso: true, dados: { urlAutorizacao: 'https://outro.exemplo/', expiraEm: '2026-11-24T12:10:00Z' } }));
    const fixture = montar();
    fixture.componentInstance.conectar();
    expect(api.post).toHaveBeenCalledWith('/v1/integracoes-marketplace/mercado-livre/conexao/iniciar', {});
    expect(toast.erro).toHaveBeenCalled();
    expect(fixture.componentInstance.ocupado()).toBeFalse();
  });

  it('testa as credenciais e avisa o resultado por toast', () => {
    const fixture = montar();
    fixture.componentInstance.testar();
    expect(api.post).toHaveBeenCalledWith('/v1/integracoes-marketplace/mercado-livre/aplicativo/testar', {});
    expect(toast.sucesso).toHaveBeenCalledWith('Credenciais aceitas pelo Mercado Livre.');
  });

  it('descarta o que foi digitado ao cancelar a edição das credenciais', () => {
    const fixture = montar();
    fixture.componentInstance.editandoApp.set(true);
    fixture.componentInstance.form.patchValue({ appId: '5555555555', clientSecret: 'abcdefghijklmnop1234' });
    fixture.componentInstance.cancelarEdicao();
    expect(fixture.componentInstance.editandoApp()).toBeFalse();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ appId: '1234567890', clientSecret: '' });
    expect(fixture.componentInstance.alterado()).toBeFalse();
  });

  it('recarrega o estado quando o servidor responde conflito de versão', () => {
    api.put.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const fixture = montar();
    api.get.calls.reset();
    fixture.componentInstance.salvarAplicativo();
    expect(toast.erroServidor).toHaveBeenCalled();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('não recarrega o estado em outros erros de salvamento', () => {
    api.put.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const fixture = montar();
    api.get.calls.reset();
    fixture.componentInstance.salvarAplicativo();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('mostra tentar de novo, e não indisponível, quando a consulta falha', () => {
    api.get.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const fixture = montar();
    expect(fixture.nativeElement.textContent).toContain('Tentar de novo');
    expect(fixture.nativeElement.textContent).not.toContain('indisponível no momento');
    api.get.and.returnValue(of({ sucesso: true, dados: comAplicativo }));
    fixture.componentInstance.tentarNovamente();
    fixture.detectChanges();
    expect(fixture.componentInstance.erroCarregamento()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Credenciais salvas');
  });

  it('pergunta antes de sair com credenciais digitadas e não salvas', async () => {
    const fixture = montar();
    fixture.componentInstance.editandoApp.set(true);
    fixture.detectChanges();
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('#ml-secret');
    campo.value = 'abcdefghijklmnop1234';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fixture.componentInstance.alterado()).toBeTrue();
    confirmacao.confirmar.and.resolveTo(false);
    expect(await fixture.componentInstance.podeSair()).toBeFalse();
    expect(confirmacao.confirmar).toHaveBeenCalled();
  });

  it('mostra a conta conectada e permite desconectar depois de confirmar', async () => {
    api.get.and.returnValue(of({ sucesso: true, dados: { ...comAplicativo, conexao } }));
    const fixture = montar();
    expect(fixture.nativeElement.textContent).toContain('ALBATROZ');
    expect(fixture.nativeElement.textContent).toContain('Conectada');
    await fixture.componentInstance.desconectar();
    expect(confirmacao.confirmar).toHaveBeenCalled();
    expect(api.delete).toHaveBeenCalledWith('/v1/integracoes-marketplace/mercado-livre/conexao');
    expect(fixture.componentInstance.estado()?.conexao).toBeNull();
  });

  it('não desconecta quando a confirmação é negada', async () => {
    confirmacao.confirmar.and.resolveTo(false);
    api.get.and.returnValue(of({ sucesso: true, dados: { ...comAplicativo, conexao } }));
    const fixture = montar();
    await fixture.componentInstance.desconectar();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('pede reconexão quando a autorização expirou', () => {
    api.get.and.returnValue(of({ sucesso: true, dados: { ...comAplicativo, conexao: { ...conexao, situacao: 2 } } }));
    const fixture = montar();
    expect(fixture.nativeElement.textContent).toContain('Precisa reconectar');
    expect(fixture.nativeElement.textContent).toContain('Reconecte a conta');
  });

  it('esconde as ações sem as permissões correspondentes', () => {
    permissoes.set(['integracoes_marketplace:ler']);
    api.get.and.returnValue(of({ sucesso: true, dados: { ...comAplicativo, conexao } }));
    const fixture = montar();
    const textos = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).map(b => b.textContent?.trim());
    expect(textos).not.toContain('Reconectar conta');
    expect(textos).not.toContain('Desconectar');
    expect(textos).not.toContain('Alterar credenciais');
    fixture.componentInstance.conectar();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('conclui a conexão quando volta do Mercado Livre com code e state', () => {
    consulta = { code: 'TG-abc', state: 'estado-aleatorio' };
    api.post.and.returnValue(of({ sucesso: true, dados: { ...comAplicativo, conexao } }));
    const fixture = montar();
    expect(api.post).toHaveBeenCalledWith('/v1/integracoes-marketplace/mercado-livre/conexao/concluir', { codigo: 'TG-abc', state: 'estado-aleatorio', erroProvedor: null });
    expect(api.get).not.toHaveBeenCalled();
    expect(toast.sucesso).toHaveBeenCalled();
    expect(fixture.componentInstance.estado()?.conexao?.nome).toBe('ALBATROZ');
  });

  it('avisa o erro por toast e recarrega o estado quando a conclusão falha', () => {
    consulta = { code: 'TG-abc', state: 'estado-aleatorio' };
    api.post.and.returnValue(throwError(() => new Error('falha')));
    const fixture = montar();
    expect(toast.erro).toHaveBeenCalledWith('Conexão não concluída.', 'Mensagem do servidor');
    expect(api.get).toHaveBeenCalled();
    expect(fixture.componentInstance.carregando()).toBeFalse();
  });
});
