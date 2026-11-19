import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/http/api.service';
import { ToastService } from '../../core/feedback/toast.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { EmpresaFlagsService } from '../../core/empresa/empresa-flags.service';
import { CONFIGURACOES_ROUTES } from '../administracao/configuracoes/configuracoes.routes';
import { MARKETING_ROUTES } from './marketing.routes';
import { PerfisSociaisComponent } from '../administracao/configuracoes/pages/configuracoes-pagina/perfis-sociais.component';
import { IdentidadeMarcaComponent } from '../administracao/configuracoes/pages/configuracoes-pagina/identidade-marca.component';
import { BriefingsListaComponent } from './pages/briefings-lista/briefings-lista.component';
import { EstrategiaEditorialComponent } from './pages/estrategia-editorial/estrategia-editorial.component';
import { filtrarConfiguracoes } from '../administracao/configuracoes/configuracoes-catalogo';

@Component({ standalone: true, template: '' }) class VazioComponent {}
const perfil = { id: 1, versao: '00000000-0000-0000-0000-000000000001', plataforma: 2, nome: 'Perfil editorial', identificador: '@perfil', ativo: true, criadoEm: '2026-11-18T12:00:00Z', atualizadoEm: '2026-11-18T12:00:00Z', autorizacaoPendente: true };
const estrategia = { habilitado: true, configurada: true, versao: perfil.versao, atualizadoEm: perfil.atualizadoEm, objetivo: 1, redes: ['Canal antigo'], formatos: ['Formato antigo'], pecasPorSemana: 3, limiteTexto: 1000, assuntosProibidos: [], linhas: [{ nome: 'Dicas', objetivo: 'Educar', exemplos: '', restricoes: '', formatos: ['Post'], participacao: 100, ativa: true }] };
const briefing = { produtos: [], id: 11, status: 2, versao: perfil.versao, assunto: 'Assunto', objetivo: 'Objetivo', publico: '', linha: 'Dicas', produtoServico: '', oferta: '', formato: 'Formato antigo', rede: 'Canal antigo', referencias: '', prazo: null, criadoEm: perfil.criadoEm, atualizadoEm: perfil.atualizadoEm };

describe('Guia e perfis sociais', () => {
  const empresa = signal(1); const usuario = signal({ id: 1 });
  const permissoes = signal(['marketing:ler', 'marketing:criar', 'marketing:editar', 'integracoes_sociais:ler', 'integracoes_sociais:criar', 'integracoes_sociais:editar', 'identidade_marca:ler', 'identidade_marca:editar']);
  let api: { get: jasmine.Spy; put: jasmine.Spy; post: jasmine.Spy; getPaginado: jasmine.Spy };
  let filtrosAtivos: boolean;
  beforeEach(() => {
    empresa.set(1); usuario.set({ id: 1 }); filtrosAtivos = true;
    permissoes.set(['marketing:ler', 'marketing:criar', 'marketing:editar', 'integracoes_sociais:ler', 'integracoes_sociais:criar', 'integracoes_sociais:editar', 'identidade_marca:ler', 'identidade_marca:editar']);
    api = { get: jasmine.createSpy('get').and.callFake((path: string) => {
      if (path === '/v1/integracoes-sociais/perfis') return of({ sucesso: true, dados: { habilitado: true, itens: [perfil] } });
      if (path === '/v1/marketing/filtros') return of({ sucesso: true, dados: { redesSociaisHabilitado: filtrosAtivos, perfis: filtrosAtivos ? [perfil] : [], redes: filtrosAtivos ? ['Instagram'] : [] } });
      if (path === '/v1/marketing/estrategia-editorial') return of({ sucesso: true, dados: estrategia });
      if (path === '/v1/configuracoes/identidade-marca') return of({ sucesso: true, dados: { habilitado: true, configurada: true, versao: perfil.versao, atualizadoEm: perfil.atualizadoEm, logoUrl: null, segmentoCadastro: null, nomeDivulgacao: 'Empresa', segmentos: [], propostaValor: '', ofertas: '', publicos: [], regioes: [], idioma: 'pt-BR', fusoHorario: 'America/Sao_Paulo', tomVoz: '', restricoes: '', fontes: 'Fonte autorizada', cores: { principal: '#335577', secundaria: '', fundo: '', texto: '' } } });
      return of({ sucesso: true, dados: [] });
    }), post: jasmine.createSpy('post').and.returnValue(of({ sucesso: true, dados: perfil })), put: jasmine.createSpy('put').and.returnValue(of({ sucesso: true, dados: perfil })), getPaginado: jasmine.createSpy('getPaginado').and.returnValue(of({ sucesso: true, dados: { dados: [briefing], totalRegistros: 1, paginaAtual: 1, totalPaginas: 1, registrosPorPagina: 10 } })) };
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'configuracoes', children: CONFIGURACOES_ROUTES }, { path: 'marketing', children: MARKETING_ROUTES }, { path: 'dashboard', component: VazioComponent }]), { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: (chave: string) => permissoes().includes(chave) } }, { provide: ApiService, useValue: api }, { provide: ToastService, useValue: { erro: jasmine.createSpy(), erroServidor: jasmine.createSpy(), sucesso: jasmine.createSpy(), aviso: jasmine.createSpy() } }, { provide: ConfirmService, useValue: { confirmar: () => Promise.resolve(true) } }, { provide: EmpresaFlagsService, useValue: { carregar: () => undefined, tinyAtivo: () => false } }] });
  });
  it('cadastra e inativa perfil manual com versão sem segredo ou conexão fictícia', async () => {
    const h = await RouterTestingHarness.create(); const pagina = await h.navigateByUrl('/configuracoes/redes-sociais', PerfisSociaisComponent);
    expect(h.routeNativeElement?.textContent).toContain('Autorização pendente');
    expect(h.routeNativeElement?.querySelector('input[type=password]')).toBeNull();
    pagina.abrir(); pagina.form.setValue({ plataforma: 2, nome: ' Novo perfil ', identificador: '@novo', ativo: true }); pagina.salvar();
    expect(api.post.calls.mostRecent().args).toEqual(['/v1/integracoes-sociais/perfis', { plataforma: 2, nome: 'Novo perfil', identificador: '@novo', ativo: true }]);
    pagina.abrir(perfil); pagina.form.controls.ativo.setValue(false); pagina.salvar();
    expect(api.put.calls.mostRecent().args[1].versaoEsperada).toBe(perfil.versao); expect(api.put.calls.mostRecent().args[1].ativo).toBeFalse();
  });
  it('recusa URL no identificador e não concede edição a quem só lê', async () => {
    const h = await RouterTestingHarness.create(); const pagina = await h.navigateByUrl('/configuracoes/redes-sociais', PerfisSociaisComponent);
    pagina.abrir(); pagina.form.patchValue({ nome: 'Perfil', identificador: 'https://exemplo.test' }); pagina.salvar(); expect(api.post).not.toHaveBeenCalled();
    permissoes.set(['integracoes_sociais:ler']); await h.fixture.whenStable(); h.detectChanges();
    expect(pagina.modal()).toBeFalse(); pagina.abrir(perfil); expect(pagina.modal()).toBeFalse();
    expect(filtrarConfiguracoes(() => false, false).flatMap(g => g.destinos).some(d => d.id === 'redes-sociais')).toBeFalse();
  });
  it('limpa lista e cancela chamada ao trocar empresa', async () => {
    const pendente = new Subject<unknown>(); api.get.and.returnValue(pendente);
    const h = await RouterTestingHarness.create(); const pagina = await h.navigateByUrl('/configuracoes/redes-sociais', PerfisSociaisComponent);
    expect(pendente.observed).toBeTrue(); empresa.set(2); await h.fixture.whenStable(); h.detectChanges(); expect(pendente.observed).toBeFalse(); expect(pagina.itens()).toEqual([]); expect(pagina.modal()).toBeFalse();
  });
  it('usa plataformas ativas do tenant e preserva rede antiga somente como legado', async () => {
    const h = await RouterTestingHarness.create(); const pagina = await h.navigateByUrl('/marketing/briefings', BriefingsListaComponent);
    pagina.abrirEditar(briefing); const opcoes = pagina.redesOpcoes(); expect(opcoes.find(o => o.valor === 'Instagram')).toBeDefined(); expect(opcoes.find(o => o.valor === 'Canal antigo')).toBeDefined();
    expect(pagina.formatosOpcoes().find(o => o.valor === 'Formato antigo')?.desabilitada).toBeTrue(); expect(pagina.rede).toBe('Canal antigo');
  });
  it('flag desligada mantém canais planejados sem voltar a texto livre', async () => {
    filtrosAtivos = false; const h = await RouterTestingHarness.create(); const pagina = await h.navigateByUrl('/marketing/briefings', BriefingsListaComponent);
    pagina.abrirEditar(briefing); h.detectChanges(); expect(pagina.redesOpcoes().find(o => o.valor === 'Canal antigo')).toBeDefined();
    expect(h.routeNativeElement?.querySelector('input[list=briefing-redes]')).toBeNull();
  });
  it('estratégia oferece multisseleção preservando legados e participação 100%', async () => {
    const h = await RouterTestingHarness.create(); const pagina = await h.navigateByUrl('/marketing/estrategia', EstrategiaEditorialComponent);
    expect(pagina.form.controls.redes.value).toEqual(['Canal antigo']); expect(pagina.redesOpcoes().find(o => o.valor === 'Canal antigo')?.desabilitada).toBeTrue(); expect(pagina.redesOpcoes().find(o => o.valor === 'Instagram')?.desabilitada).toBeFalse(); expect(pagina.totalAtivas()).toBe(100);
  });
  it('estratégia usa o seletor múltiplo padrão do sistema nos dois campos', async () => {
    const h = await RouterTestingHarness.create(); await h.navigateByUrl('/marketing/estrategia', EstrategiaEditorialComponent); h.detectChanges();
    const seletores = h.routeNativeElement!.querySelectorAll('p-multiselect');
    expect(seletores.length).toBe(2);
    expect(h.routeNativeElement!.textContent).not.toContain('empty');
  });
  it('guia começa fechado e navegar etapas não preenche os campos', async () => {
    const h = await RouterTestingHarness.create(); const pagina = await h.navigateByUrl('/marketing/estrategia', EstrategiaEditorialComponent); const antes = pagina.form.getRawValue();
    const guia = h.routeNativeElement!.querySelector('app-marketing-guia')!; const detalhe = guia.querySelector('details')!; expect(detalhe.open).toBeFalse(); detalhe.open = true;
    const proxima = [...guia.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Próxima etapa')!; proxima.click(); h.detectChanges(); expect(guia.textContent).toContain('Cadastro editorial permite'); expect(pagina.form.getRawValue()).toEqual(antes);
  });
  it('ajuda de cor tem botão acessível, exemplo e não altera a marca', async () => {
    const h = await RouterTestingHarness.create(); const pagina = await h.navigateByUrl('/configuracoes/identidade-marca', IdentidadeMarcaComponent); const antes = pagina.form.getRawValue();
    const botao = h.routeNativeElement!.querySelector<HTMLButtonElement>('button[aria-label="Ajuda: Principal"]')!; expect(botao.type).toBe('button'); expect(botao.getAttribute('aria-expanded')).toBe('false');
    botao.click(); await h.fixture.whenStable(); h.detectChanges(); expect(document.body.textContent).toContain('Cor real da identidade visual'); expect(pagina.form.getRawValue()).toEqual(antes);
    const fechar = [...document.body.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Fechar ajuda')!; fechar.click(); await h.fixture.whenStable(); expect(pagina.form.getRawValue()).toEqual(antes);
  });
});
