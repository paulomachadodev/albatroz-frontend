import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/feedback/toast.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { Arte } from './models/arte.model';
import { ArtesService } from './services/artes.service';
import { ArtesPecaComponent } from './components/artes-peca.component';

const versao = '00000000-0000-0000-0000-0000000000bb';

function arte(extra: Partial<Arte> = {}): Arte {
  return {
    id: 3, versao, pecaId: 5, versaoConteudo: 1, produtoId: 99, formato: 1, modelo: 1, titulo: 'Volta às aulas', subtitulo: '', url: 'https://cdn.exemplo.com/a.png',
    largura: 1080, altura: 1080, status: 1, ordem: 1, aprovadaEm: null, arquivoDisponivel: true, arquivoRemovidoEm: null, criadoEm: '2026-11-18T12:00:00Z', ...extra
  };
}

@Component({
  standalone: true, imports: [ArtesPecaComponent],
  template: `<div (input)="eventosRecebidos = eventosRecebidos + 1" (change)="eventosRecebidos = eventosRecebidos + 1"><app-artes-peca [pecaId]="5" [versaoConteudo]="versaoTexto()" tituloSugerido="Volta às aulas com estilo" [arquivada]="arquivada()" (possuiAprovadaAlterada)="aprovada = $event" /></div>`
})
class HospedeiroComponent {
  readonly versaoTexto = signal(1);
  readonly arquivada = signal(false);
  aprovada: boolean | null = null;
  eventosRecebidos = 0;
}

describe('Artes da peça', () => {
  const empresa = signal(1);
  const usuario = signal({ id: 1 });
  const permissoes = signal(['marketing:ler', 'marketing:editar', 'marketing:aprovar']);
  let api: { listar: jasmine.Spy; gerar: jasmine.Spy; aprovar: jasmine.Spy; descartar: jasmine.Spy; buscarProdutosComFoto: jasmine.Spy };
  let confirm: { confirmar: jasmine.Spy; estado: () => null; responder: jasmine.Spy };
  let toast: { erro: jasmine.Spy; erroServidor: jasmine.Spy; sucesso: jasmine.Spy; aviso: jasmine.Spy };

  beforeEach(() => {
    empresa.set(1); usuario.set({ id: 1 }); permissoes.set(['marketing:ler', 'marketing:editar', 'marketing:aprovar']);
    api = {
      listar: jasmine.createSpy('listar').and.returnValue(of({ sucesso: true, dados: { habilitado: true, versaoConteudoAtual: 1, itens: [arte()] } })),
      gerar: jasmine.createSpy('gerar').and.returnValue(of({ sucesso: true, dados: arte({ id: 4 }) })),
      aprovar: jasmine.createSpy('aprovar').and.returnValue(of({ sucesso: true, dados: arte({ status: 2 }) })),
      descartar: jasmine.createSpy('descartar').and.returnValue(of({ sucesso: true, dados: arte({ status: 3 }) })),
      buscarProdutosComFoto: jasmine.createSpy('buscar').and.returnValue(of([{ id: 99, nome: 'Caderno (C1)' }]))
    };
    confirm = { confirmar: jasmine.createSpy('confirmar').and.resolveTo(true), estado: () => null, responder: jasmine.createSpy('responder') };
    toast = { erro: jasmine.createSpy(), erroServidor: jasmine.createSpy(), sucesso: jasmine.createSpy(), aviso: jasmine.createSpy() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: (chave: string) => permissoes().includes(chave) } },
        { provide: ArtesService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: ConfirmService, useValue: confirm }
      ]
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(HospedeiroComponent);
    fixture.detectChanges();
    const artes = fixture.debugElement.children[0].children[0].componentInstance as ArtesPecaComponent;
    return { fixture, artes, texto: () => (fixture.nativeElement as HTMLElement).textContent ?? '' };
  }

  it('lista as artes ativas e avisa quando não há imagem aprovada', () => {
    const { fixture, texto } = montar();
    expect(api.listar).toHaveBeenCalledWith(5);
    expect(texto()).toContain('Volta às aulas');
    expect(texto()).toContain('Sem imagem aprovada');
    expect(fixture.componentInstance.aprovada).toBeFalse();
    expect(fixture.nativeElement.querySelector('img')!.getAttribute('src')).toBe('https://cdn.exemplo.com/a.png');
  });

  it('com arte aprovada deixa de avisar e emite que há imagem', () => {
    api.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: true, versaoConteudoAtual: 1, itens: [arte({ status: 2 })] } }));
    const { fixture, texto } = montar();
    expect(texto()).not.toContain('Sem imagem aprovada');
    expect(fixture.componentInstance.aprovada).toBeTrue();
  });

  it('arquivo removido mostra o aviso para refazer e não oferece aprovar', () => {
    api.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: true, versaoConteudoAtual: 1, itens: [arte({ arquivoDisponivel: false, arquivoRemovidoEm: '2026-11-20T00:00:00Z' })] } }));
    const { fixture, texto } = montar();
    expect(texto()).toContain('Arquivo removido');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).some(b => b.textContent?.trim() === 'Aprovar')).toBeFalse();
  });

  it('descartadas não aparecem na lista', () => {
    api.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: true, versaoConteudoAtual: 1, itens: [arte({ id: 8, titulo: 'Arte descartada', status: 3 })] } }));
    const { artes, texto } = montar();
    expect(artes.ativas().length).toBe(0);
    expect(texto()).not.toContain('Arte descartada');
    expect(texto()).toContain('Nenhuma arte criada');
  });

  it('avisa quando o texto mudou depois da arte', () => {
    const { fixture, artes } = montar();
    fixture.componentInstance.versaoTexto.set(3);
    fixture.detectChanges();
    expect(artes.desatualizada(arte())).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('O texto mudou depois desta arte');
  });

  it('criar arte com foto exige produto, aceita título vazio e envia a requisição', () => {
    const { artes } = montar();
    artes.abrirCriacao();
    expect(artes.form.controls.titulo.value).toBe('');
    artes.gerar();
    expect(api.gerar).not.toHaveBeenCalled();
    expect(toast.aviso).toHaveBeenCalled();
    artes.produto.set({ id: 99, nome: 'Caderno (C1)' });
    artes.form.patchValue({ formato: 3, subtitulo: ' Tudo para o ano ' });
    artes.gerar();
    expect(api.gerar).toHaveBeenCalledWith(5, { formato: 3, modelo: 1, produtoId: 99, titulo: '', subtitulo: 'Tudo para o ano' });
    expect(artes.modal()).toBeFalse();
  });

  it('modelo de texto sugere o título a partir da peça e o exige', () => {
    const { artes } = montar();
    artes.abrirCriacao();
    artes.form.controls.modelo.setValue(3);
    expect(artes.form.controls.titulo.value).toBe('Volta às aulas com estilo');
    artes.form.patchValue({ titulo: '  ' });
    artes.gerar();
    expect(api.gerar).not.toHaveBeenCalled();
    expect(toast.aviso).toHaveBeenCalled();
  });

  it('eventos dos campos do diálogo não chegam ao formulário da peça', () => {
    const { fixture, artes } = montar();
    artes.abrirCriacao();
    fixture.detectChanges();
    const campo: HTMLInputElement = document.querySelector('#arte-titulo')!;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.componentInstance.eventosRecebidos).toBe(0);
  });

  it('modelo de texto não pede produto e não o envia', () => {
    const { artes } = montar();
    artes.abrirCriacao();
    artes.produto.set({ id: 99, nome: 'Caderno (C1)' });
    artes.form.controls.modelo.setValue(3);
    expect(artes.usaFoto()).toBeFalse();
    expect(artes.produto()).toBeNull();
    artes.gerar();
    expect(api.gerar.calls.mostRecent().args[1].produtoId).toBeNull();
  });

  it('não gera com título vazio ou longo demais', () => {
    const { artes } = montar();
    artes.abrirCriacao();
    artes.form.controls.modelo.setValue(3);
    artes.form.patchValue({ titulo: '' });
    artes.gerar();
    artes.form.patchValue({ titulo: 'a'.repeat(71) });
    artes.gerar();
    expect(api.gerar).not.toHaveBeenCalled();
  });

  it('aprova e descarta com confirmação e a versão da arte', async () => {
    const { artes } = montar();
    await artes.aprovar(arte());
    expect(api.aprovar).toHaveBeenCalledWith(5, 3, versao);
    await artes.descartar(arte());
    expect(api.descartar).toHaveBeenCalledWith(5, 3, versao);
    expect(confirm.confirmar).toHaveBeenCalledTimes(2);
  });

  it('sem permissão de aprovar ou editar não há ações', async () => {
    permissoes.set(['marketing:ler']);
    const { fixture, artes } = montar();
    await artes.aprovar(arte());
    await artes.descartar(arte());
    artes.abrirCriacao();
    expect(api.aprovar).not.toHaveBeenCalled();
    expect(api.descartar).not.toHaveBeenCalled();
    expect(artes.modal()).toBeFalse();
    const textos = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).map(b => b.textContent?.trim());
    expect(textos).not.toContain('Criar arte');
    expect(textos).not.toContain('Descartar');
  });

  it('peça arquivada não permite criar nem descartar', async () => {
    const { fixture, artes } = montar();
    fixture.componentInstance.arquivada.set(true);
    fixture.detectChanges();
    artes.abrirCriacao();
    await artes.descartar(arte());
    expect(artes.modal()).toBeFalse();
    expect(api.descartar).not.toHaveBeenCalled();
  });

  it('erro do servidor ao gerar mostra a mensagem e libera o botão', () => {
    api.gerar.and.returnValue(throwError(() => new Error('falha')));
    const { artes } = montar();
    artes.abrirCriacao();
    artes.form.controls.modelo.setValue(3);
    artes.gerar();
    expect(toast.erroServidor).toHaveBeenCalled();
    expect(artes.processando()).toBeFalse();
  });

  it('indisponível quando o servidor desliga marketing', () => {
    api.listar.and.returnValue(of({ sucesso: true, dados: { habilitado: false, versaoConteudoAtual: 0, itens: [] } }));
    const { texto } = montar();
    expect(texto()).toContain('indisponíveis');
  });
});
