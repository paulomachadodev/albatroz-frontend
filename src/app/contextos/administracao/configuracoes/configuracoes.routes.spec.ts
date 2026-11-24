import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { EmpresaFlagsService } from '../../../core/empresa/empresa-flags.service';
import { ApiService } from '../../../core/http/api.service';
import { ConfirmService } from '../../../core/feedback/confirm.service';
import { CONFIGURACOES_ROUTES } from './configuracoes.routes';
import { ConfiguracoesPaginaComponent } from './pages/configuracoes-pagina/configuracoes-pagina.component';
import { EmailConfiguracaoComponent } from './pages/configuracoes-pagina/email-configuracao.component';

describe('Central de Configurações e formulários existentes', () => {
  let permissoes: string[] | null;
  let api: { get: jasmine.Spy; put: jasmine.Spy };
  const empresa = signal(99);
  const usuario = signal({ id: 99 });

  beforeEach(() => {
    permissoes = null;
    empresa.set(99);
    usuario.set({ id: 99 });
    api = {
      get: jasmine.createSpy('get').and.callFake((url: string) => of({ dados: /configuracoes$|vendedores|listas-preco|cnab$/.test(url) ? [] : null })),
      put: jasmine.createSpy('put').and.returnValue(of({ dados: null }))
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'configuracoes', children: CONFIGURACOES_ROUTES }, { path: 'dashboard', component: ConfiguracoesPaginaComponent }]),
        { provide: AuthService, useValue: { usuario, temPermissao: (permissao: string) => permissoes === null || permissoes.includes(permissao), empresaIdAtual: () => empresa() } },
        { provide: EmpresaFlagsService, useValue: { carregar: () => undefined, tinyAtivo: () => true } },
        { provide: ApiService, useValue: api }
      ]
    });
  });

  it('abre a central sem carregar configurações ou segredos dos formulários', async () => {
    const harness = await RouterTestingHarness.create('/configuracoes');
    expect(harness.routeNativeElement?.textContent).toContain('E-mail e SMTP');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('abre por link direto todos os oito formulários sem a faixa de abas', async () => {
    const harness = await RouterTestingHarness.create();
    for (const rota of ['email', 'listas-preco', 'metas', 'condicoes-comerciais', 'estoque', 'fiscal', 'catalogos', 'alertas-sincronizacao']) {
      await harness.navigateByUrl(`/configuracoes/${rota}`);
      expect(TestBed.inject(Router).url).toBe(`/configuracoes/${rota}`);
      expect(harness.routeNativeElement?.textContent).toContain('Voltar às configurações');
      expect(harness.routeNativeElement?.querySelectorAll('[role="tab"]').length).toBe(0);
    }
  });

  it('bloqueia acesso direto sem permissão e permite central restrita a perfis', async () => {
    permissoes = ['perfis:ler'];
    const harness = await RouterTestingHarness.create('/configuracoes');
    expect(harness.routeNativeElement?.textContent).toContain('Perfis e permissões');
    expect(harness.routeNativeElement?.textContent).not.toContain('E-mail e SMTP');
    await harness.navigateByUrl('/configuracoes/email');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('protege alterações não salvas e preserva os payloads SMTP', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/email', EmailConfiguracaoComponent);
    pagina.smtpHost = 'smtp.exemplo.test';
    pagina.smtpUsuario = 'usuario';
    pagina.registrarAlteracao();
    const confirmar = spyOn(TestBed.inject(ConfirmService), 'confirmar').and.resolveTo(false);
    await harness.navigateByUrl('/configuracoes');
    expect(confirmar).toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/configuracoes/email');
    pagina.salvarEmail();
    expect(api.put).toHaveBeenCalledWith('/v1/configuracoes/smtp_host', { valor: 'smtp.exemplo.test' });
    expect(api.put).toHaveBeenCalledWith('/v1/configuracoes/smtp_usuario', { valor: 'usuario' });
    expect(api.put).not.toHaveBeenCalledWith('/v1/configuracoes/smtp_senha', jasmine.anything());
    expect(pagina.alterado()).toBeFalse();
    await harness.navigateByUrl('/configuracoes');
    expect(TestBed.inject(Router).url).toBe('/configuracoes');
  });

  it('mantém alterações pendentes quando salvar falha', async () => {
    api.put.and.returnValue(throwError(() => new Error('falha simulada')));
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/email', EmailConfiguracaoComponent);
    pagina.smtpHost = 'smtp.exemplo.test';
    pagina.smtpUsuario = 'usuario';
    pagina.registrarAlteracao();
    pagina.salvarEmail();
    expect(pagina.alterado()).toBeTrue();
    pagina.marcarSalvo();
  });

  it('renderiza somente leitura sem permissão de edição', async () => {
    permissoes = ['configuracoes:ler'];
    const harness = await RouterTestingHarness.create('/configuracoes/email');
    expect(harness.routeNativeElement?.querySelector('fieldset')?.disabled).toBeTrue();
  });

  it('encerra o formulário quando a empresa da sessão muda', async () => {
    const harness = await RouterTestingHarness.create();
    const pagina = await harness.navigateByUrl('/configuracoes/email', EmailConfiguracaoComponent);
    pagina.registrarAlteracao();
    empresa.set(100);
    usuario.set({ id: 99 });
    TestBed.tick();
    await harness.fixture.whenStable();
    expect(pagina.podeEditar()).toBeFalse();
    expect(TestBed.inject(Router).url).toBe('/configuracoes');
    expect(api.put).not.toHaveBeenCalled();
  });
});
