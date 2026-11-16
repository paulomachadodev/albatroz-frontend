import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { EmpresaFlagsService } from '../../core/empresa/empresa-flags.service';
import { LogoBadgeComponent } from '../../shared/components/logo-badge/logo-badge.component';
import { ScrollLockService } from '../../shared/services/scroll-lock.service';
import { ItemMenu, MENU_CATALOGO, encontrarPagina, filtrarMenu, listarPaginas, normalizarBusca } from './menu-catalogo';

interface PreferenciasMenu {
  recolhido: boolean;
  expandidos: string[];
  favoritos: string[];
  recentes: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, InputTextModule, LogoBadgeComponent],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnDestroy {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly empresaFlags = inject(EmpresaFlagsService);
  private readonly scrollLock = inject(ScrollLockService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogoMobile');
  private readonly buscaDesktop = viewChild<ElementRef<HTMLInputElement>>('buscaDesktop');
  private ultimoFoco: HTMLElement | null = null;
  private timerFoco?: ReturnType<typeof setTimeout>;
  private scrollTravado = false;
  readonly usuario = this.auth.usuario;
  readonly url = signal(this.router.url);
  readonly recolhido = signal(false);
  readonly expandidos = signal<string[]>([]);
  readonly favoritosIds = signal<string[]>([]);
  readonly recentesIds = signal<string[]>([]);
  readonly busca = signal('');
  readonly recentesAbertos = signal(false);
  readonly usuarioMenuAberto = signal(false);
  readonly mobileAberto = signal(false);
  readonly menu = computed(() => filtrarMenu(MENU_CATALOGO, chave => this.auth.temPermissao(chave), this.empresaFlags.tinyAtivo(), this.auth.podeAcessarDashboard()));
  readonly modulos = computed(() => this.menu().filter(item => item.id !== 'configuracoes'));
  readonly configuracoes = computed(() => this.menu().find(item => item.id === 'configuracoes'));
  readonly paginas = computed(() => listarPaginas(this.menu()).filter((pagina, indice, paginas) => paginas.findIndex(candidata => candidata.item.rota === pagina.item.rota) === indice));
  readonly paginaAtiva = computed(() => encontrarPagina(this.paginas(), this.url()));
  readonly favoritos = computed(() => this.favoritosIds().flatMap(id => this.paginas().filter(p => p.item.id === id)).slice(0, 8));
  readonly recentes = computed(() => this.recentesIds().flatMap(id => this.paginas().filter(p => p.item.id === id)).slice(0, 5));
  readonly resultados = computed(() => {
    const termos = normalizarBusca(this.busca()).split(/\s+/).filter(Boolean);
    return termos.length ? this.paginas().filter(p => termos.every(termo => normalizarBusca(p.caminho).includes(termo))) : [];
  });
  readonly iniciais = computed(() => this.usuario()?.nome?.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join('').toUpperCase() ?? '?');
  private readonly chavePreferencias = computed(() => {
    const usuario = this.usuario();
    const empresa = this.auth.empresaIdAtual();
    return usuario && empresa ? `erp.menu.v2:${empresa}:${usuario.id}` : null;
  });

  constructor() {
    this.empresaFlags.carregar();
    this.router.events.pipe(filter(evento => evento instanceof NavigationEnd), takeUntilDestroyed()).subscribe(evento => {
      this.url.set(evento.urlAfterRedirects);
      this.fecharMobile();
      this.usuarioMenuAberto.set(false);
      this.busca.set('');
    });
    effect(() => {
      const chave = this.chavePreferencias();
      untracked(() => {
      const preferencias = this.lerPreferencias(chave);
      this.recolhido.set(preferencias.recolhido);
      this.expandidos.set(preferencias.expandidos);
      this.favoritosIds.set(preferencias.favoritos);
      this.recentesIds.set(preferencias.recentes);
      this.busca.set('');
      this.recentesAbertos.set(false);
      this.usuarioMenuAberto.set(false);
      this.fecharMobile();
      });
    });
    effect(() => {
      const pagina = this.paginaAtiva();
      if (pagina) {
        this.expandidos.update(ids => [...new Set([...ids, ...pagina.ancestrais])]);
        this.recentesIds.update(ids => [pagina.item.id, ...ids.filter(id => id !== pagina.item.id)].slice(0, 5));
        untracked(() => this.persistir());
      }
    });
  }

  expandido(item: ItemMenu): boolean {
    return this.expandidos().includes(item.id);
  }

  buscar(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }

  ativo(item: ItemMenu): boolean {
    const pagina = this.paginaAtiva();
    return pagina?.item.id === item.id || !!pagina?.ancestrais.includes(item.id);
  }

  alternarRamo(item: ItemMenu): void {
    if (this.recolhido()) {
      this.recolhido.set(false);
      this.expandidos.update(ids => [...new Set([...ids, item.id])]);
    } else {
      this.expandidos.update(ids => ids.includes(item.id) ? ids.filter(id => id !== item.id) : [...ids, item.id]);
    }
    this.persistir();
  }

  alternarRecolhido(): void {
    this.recolhido.update(valor => !valor);
    this.usuarioMenuAberto.set(false);
    this.busca.set('');
    this.persistir();
  }

  favorito(item: ItemMenu): boolean {
    return this.favoritosIds().includes(item.id);
  }

  alternarRecentes(): void {
    this.recentesAbertos.update(valor => !valor);
  }

  alternarUsuario(): void {
    this.usuarioMenuAberto.update(valor => !valor);
  }

  alternarFavorito(item: ItemMenu): void {
    this.favoritosIds.update(ids => ids.includes(item.id) ? ids.filter(id => id !== item.id) : [...ids, item.id].slice(-8));
    this.persistir();
  }

  aoNavegar(): void {
    this.busca.set('');
    this.fecharMobile();
    this.usuarioMenuAberto.set(false);
  }

  abrirMobile(): void {
    const dialogo = this.dialogo()?.nativeElement;
    if (!dialogo || dialogo.open) return;
    this.ultimoFoco = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogo.showModal();
    this.mobileAberto.set(true);
    this.scrollLock.travar();
    this.scrollTravado = true;
  }

  fecharMobile(): void {
    this.dialogo()?.nativeElement.close();
    this.mobileAberto.set(false);
    if (this.scrollTravado) this.scrollLock.destravar();
    this.scrollTravado = false;
    if (this.ultimoFoco?.isConnected) this.ultimoFoco.focus();
    this.ultimoFoco = null;
  }

  aoClicarDialogo(evento: MouseEvent): void {
    if (evento.target === this.dialogo()?.nativeElement) this.fecharMobile();
  }

  @HostListener('window:resize')
  aoRedimensionar(): void {
    if (window.matchMedia('(min-width: 768px)').matches && this.mobileAberto()) this.fecharMobile();
  }

  @HostListener('document:keydown', ['$event'])
  aoPressionarTecla(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      this.fecharMobile();
      this.usuarioMenuAberto.set(false);
      this.busca.set('');
    }
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
      if (evento.target instanceof HTMLElement && evento.target.matches('input,textarea,[contenteditable="true"]')) return;
      evento.preventDefault();
      if (window.matchMedia('(max-width: 767px)').matches) this.abrirMobile();
      else this.recolhido.set(false);
      this.timerFoco = setTimeout(() => {
        const input = this.mobileAberto() ? this.dialogo()?.nativeElement.querySelector<HTMLInputElement>('input') : this.buscaDesktop()?.nativeElement;
        input?.focus();
      });
    }
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: MouseEvent): void {
    if (evento.target instanceof Node && !this.host.nativeElement.contains(evento.target)) this.usuarioMenuAberto.set(false);
  }

  sair(): void {
    this.fecharMobile();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private lerPreferencias(chave: string | null): PreferenciasMenu {
    const padrao: PreferenciasMenu = { recolhido: false, expandidos: [], favoritos: [], recentes: [] };
    if (!chave) return padrao;
    try {
      const valor: Partial<PreferenciasMenu> = JSON.parse(localStorage.getItem(chave) ?? '{}');
      const ids = (lista: unknown): string[] => Array.isArray(lista) ? lista.filter((id): id is string => typeof id === 'string').slice(0, 100) : [];
      return { recolhido: valor.recolhido === true, expandidos: ids(valor.expandidos), favoritos: ids(valor.favoritos), recentes: ids(valor.recentes) };
    } catch {
      return padrao;
    }
  }

  private persistir(): void {
    const chave = this.chavePreferencias();
    if (!chave) return;
    try {
      localStorage.setItem(chave, JSON.stringify({ recolhido: this.recolhido(), expandidos: this.expandidos(), favoritos: this.favoritosIds(), recentes: this.recentesIds() }));
    } catch {
      return;
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timerFoco);
    this.fecharMobile();
  }
}
