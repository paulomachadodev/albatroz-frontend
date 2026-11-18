import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/feedback/toast.service';
import { Calendario } from './models/calendario.model';
import { PecaResumo } from './models/peca.model';
import { CalendarioService } from './services/calendario.service';
import { PecasService } from './services/pecas.service';
import { CalendarioMarketingComponent } from './pages/calendario/calendario.component';

@Component({ standalone: true, template: '' }) class VazioComponent {}

const versao = '00000000-0000-0000-0000-0000000000aa';

function resumo(extra: Partial<PecaResumo> = {}): PecaResumo {
  return { id: 5, versao, briefingId: 11, rede: 'Instagram', formato: 'Carrossel', status: 1, versaoAtual: 1, versaoAprovada: null, aprovadaEm: null, planejadaPara: null, atualizadoEm: '2026-11-18T12:00:00Z', resumo: 'Dicas de beleza escolar', ...extra };
}

function calendario(pecas: PecaResumo[]): Calendario {
  return {
    habilitado: true, inicio: '2026-11-01', fim: '2026-12-12', pecas,
    datas: [
      { chave: 'black-friday-2026', nome: 'Black Friday', categoria: 2, inicio: '2026-11-27', fim: null, relevancia: 3, dica: 'Maior data de promoções.' },
      { chave: 'consciencia-negra-2026', nome: 'Consciência Negra', categoria: 4, inicio: '2026-11-20', fim: null, relevancia: 1, dica: 'Feriado.' },
      { chave: 'volta-aulas-2027', nome: 'Temporada de volta às aulas', categoria: 3, inicio: '2026-11-25', fim: '2026-12-05', relevancia: 3, dica: 'Prepare estoque.' }
    ]
  };
}

describe('Calendário de marketing', () => {
  const empresa = signal(1);
  const usuario = signal({ id: 1 });
  const permissoes = signal(['marketing:ler', 'marketing:editar']);
  let calendarioApi: { obter: jasmine.Spy };
  let pecasApi: { listar: jasmine.Spy; planejar: jasmine.Spy };
  const agendada = resumo({ id: 7, planejadaPara: new Date(2026, 10, 12, 9, 30).toISOString(), resumo: 'Post agendado' });

  beforeEach(() => {
    empresa.set(1); usuario.set({ id: 1 }); permissoes.set(['marketing:ler', 'marketing:editar']);
    calendarioApi = { obter: jasmine.createSpy('obter').and.returnValue(of({ sucesso: true, dados: calendario([agendada]) })) };
    pecasApi = {
      listar: jasmine.createSpy('listar').and.returnValue(of({ sucesso: true, dados: { habilitado: true, itens: [agendada, resumo(), resumo({ id: 9, status: 3 })] } })),
      planejar: jasmine.createSpy('planejar').and.returnValue(of({ sucesso: true, dados: {} }))
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'marketing/calendario', component: CalendarioMarketingComponent }, { path: 'marketing', component: VazioComponent }, { path: 'dashboard', component: VazioComponent }]),
        { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: (chave: string) => permissoes().includes(chave) } },
        { provide: CalendarioService, useValue: calendarioApi },
        { provide: PecasService, useValue: pecasApi },
        { provide: ToastService, useValue: { erro: jasmine.createSpy(), erroServidor: jasmine.createSpy(), sucesso: jasmine.createSpy(), aviso: jasmine.createSpy() } }
      ]
    });
  });

  async function abrirEm(ano: number, mes: number) {
    const h = await RouterTestingHarness.create();
    const pagina = await h.navigateByUrl('/marketing/calendario', CalendarioMarketingComponent);
    pagina.mes.set(new Date(ano, mes, 1));
    pagina.carregar();
    h.detectChanges();
    return { h, pagina };
  }

  it('monta 42 dias começando no domingo e consulta o período visível', async () => {
    const { pagina } = await abrirEm(2026, 10);
    expect(pagina.dias().length).toBe(42);
    expect(pagina.dias()[0].chave).toBe('2026-11-01');
    expect(pagina.dias()[41].chave).toBe('2026-12-12');
    expect(calendarioApi.obter).toHaveBeenCalledWith('2026-11-01', '2026-12-12');
    const dezembro = pagina.dias().filter(d => d.foraDoMes);
    expect(dezembro.every(d => d.chave.startsWith('2026-12'))).toBeTrue();
  });

  it('mostra datas comemorativas no dia certo e períodos separados', async () => {
    const { h, pagina } = await abrirEm(2026, 10);
    const blackFriday = pagina.dias().find(d => d.chave === '2026-11-27')!;
    expect(blackFriday.datas.map(d => d.nome)).toEqual(['Black Friday']);
    expect(pagina.periodos().map(p => p.nome)).toEqual(['Temporada de volta às aulas']);
    expect(pagina.dias().some(d => d.datas.some(x => x.chave === 'volta-aulas-2027'))).toBeFalse();
    expect(h.routeNativeElement!.textContent).toContain('Black Friday');
    expect(h.routeNativeElement!.textContent).toContain('25/11 a 05/12');
  });

  it('coloca a peça prevista no dia local e abre o editor de data', async () => {
    const { pagina } = await abrirEm(2026, 10);
    const dia = pagina.dias().find(d => d.chave === '2026-11-12')!;
    expect(dia.pecas.map(p => p.id)).toEqual([7]);
    pagina.abrir(dia.pecas[0]);
    expect(pagina.selecionada()!.id).toBe(7);
    expect(pagina.novaData.value).toBe('2026-11-12T09:30');
  });

  it('altera data e hora enviando ISO e a versão da peça, depois recarrega', async () => {
    const { pagina } = await abrirEm(2026, 10);
    pagina.abrir(agendada);
    pagina.novaData.setValue('2026-11-14T15:45');
    pagina.salvarData();
    expect(pagina.salvando()).toBeFalse();
    const args = pecasApi.planejar.calls.mostRecent().args;
    expect(args[0]).toBe(7);
    expect(new Date(args[1]).getTime()).toBe(new Date(2026, 10, 14, 15, 45).getTime());
    expect(args[2]).toBe(versao);
    expect(calendarioApi.obter.calls.count()).toBeGreaterThan(1);
    expect(pagina.selecionada()).toBeNull();
  });

  it('remove a data prevista com null e não exige data para remover', async () => {
    const { pagina } = await abrirEm(2026, 10);
    pagina.abrir(agendada);
    pagina.novaData.setValue('');
    pagina.salvarData(true);
    expect(pecasApi.planejar.calls.mostRecent().args[1]).toBeNull();
  });

  it('não salva sem data escolhida', async () => {
    const { pagina } = await abrirEm(2026, 10);
    pagina.abrir(resumo());
    pagina.novaData.setValue('');
    pagina.salvarData();
    expect(pecasApi.planejar).not.toHaveBeenCalled();
  });

  it('lista só as peças ativas sem data', async () => {
    const { pagina } = await abrirEm(2026, 10);
    expect(pagina.semData().map(p => p.id)).toEqual([5]);
  });

  it('sem permissão de editar não salva nem mostra Definir data', async () => {
    permissoes.set(['marketing:ler']);
    const { h, pagina } = await abrirEm(2026, 10);
    pagina.abrir(resumo());
    pagina.salvarData();
    expect(pecasApi.planejar).not.toHaveBeenCalled();
    expect(Array.from(h.routeNativeElement!.querySelectorAll('button')).some(b => b.textContent?.includes('Definir data'))).toBeFalse();
  });

  it('muda de mês e consulta o novo período', async () => {
    const { pagina } = await abrirEm(2026, 10);
    pagina.mudarMes(1);
    expect(pagina.titulo()).toBe('Dezembro de 2026');
    expect(calendarioApi.obter.calls.mostRecent().args[0]).toBe('2026-11-29');
  });

  it('informa indisponibilidade quando o servidor desliga marketing', async () => {
    calendarioApi.obter.and.returnValue(of({ sucesso: true, dados: { ...calendario([]), habilitado: false } }));
    const { h } = await abrirEm(2026, 10);
    expect(h.routeNativeElement!.textContent).toContain('indisponível');
  });
});
