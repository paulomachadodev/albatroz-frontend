import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { EmpresaFlagsService } from '../../core/empresa/empresa-flags.service';
import { ThemeService } from '../../core/theme/theme.service';
import { SidebarComponent } from './sidebar.component';

describe('Menu lateral', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  const empresa = signal(1001);
  const usuario = signal({ id: 77, nome: 'Usuário de teste' });

  beforeEach(async () => {
    empresa.set(1001);
    localStorage.removeItem('erp.menu.v2:1001:77');
    localStorage.removeItem('erp.menu.v2:1002:77');
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { usuario, empresaIdAtual: () => empresa(), temPermissao: () => true, podeAcessarDashboard: () => true } },
        { provide: EmpresaFlagsService, useValue: { carregar: () => undefined, tinyAtivo: () => false } },
        { provide: ThemeService, useValue: { temaAtual: () => 'light' } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.removeItem('erp.menu.v2:1001:77');
    localStorage.removeItem('erp.menu.v2:1002:77');
  });

  it('abre três níveis por clique e deixa subníveis sem ícones', () => {
    const componente = fixture.componentInstance;
    const compras = componente.modulos().find(item => item.id === 'compras')!;
    const documentos = compras.filhos!.find(item => item.id === 'compras-documentos')!;
    componente.alternarRamo(compras);
    componente.alternarRamo(documentos);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('aside a')) as HTMLAnchorElement[];
    const nota = links.find(link => link.textContent?.includes('Entrada de notas'))!;
    expect(nota).toBeDefined();
    expect(nota.querySelector('.material-symbols-outlined')).toBeNull();
  });

  it('não expande ao mover o mouse e isola favoritos por empresa', () => {
    const componente = fixture.componentInstance;
    componente.alternarRecolhido();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('aside').dispatchEvent(new MouseEvent('mouseenter'));
    expect(componente.recolhido()).toBeTrue();
    componente.alternarFavorito(componente.paginas().find(p => p.item.id === 'produtos')!.item);
    expect(componente.favoritos().length).toBe(1);
    empresa.set(1002);
    fixture.detectChanges();
    expect(componente.favoritos().length).toBe(0);
    expect(componente.recolhido()).toBeFalse();
    empresa.set(1001);
    fixture.detectChanges();
    expect(componente.favoritos().length).toBe(1);
  });

  it('abre drawer modal com Escape e libera a trava de rolagem', () => {
    const componente = fixture.componentInstance;
    componente.abrirMobile();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog').open).toBeTrue();
    expect(document.body.classList.contains('scroll-bloqueado')).toBeTrue();
    componente.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.nativeElement.querySelector('dialog').open).toBeFalse();
    expect(document.body.classList.contains('scroll-bloqueado')).toBeFalse();
  });
});
