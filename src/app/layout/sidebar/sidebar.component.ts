import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { ToggleComponent } from '../../shared/components/toggle/toggle.component';

export interface ItemMenu {
  label: string;
  rota?:  string;
  icone: string;
  badge?: string;
  permissao?: string;
  subItens?: ItemMenu[];
}

export interface GrupoMenu {
  titulo: string;
  icone: string;
  itens: ItemMenu[];
}

const CHAVE_LOCALSTORAGE_FIXADO = 'menu-fixado';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ToggleComponent],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  theme = inject(ThemeService);

  fixado = signal(this.carregarFixado());
  contextoHover = signal<string | null>(null);

  colunaAExpandida = computed(() => this.fixado() || this.contextoHover() !== null);

  private expandidosPorItem = new Map<string, ReturnType<typeof signal<boolean>>>();

  grupos: GrupoMenu[] = [
    {
      titulo: 'Visão geral',
      icone: 'space_dashboard',
      itens: [
        { label: 'Dashboard',  rota: '/dashboard', icone: 'dashboard' }
      ]
    },
    {
      titulo: 'Cadastros',
      icone: 'folder_open',
      itens: [
        { label: 'Produtos',     rota: '/produtos',            icone: 'inventory_2', permissao: 'produtos:ler' },
        { label: 'Contatos',     rota: '/cadastros/contatos',  icone: 'contacts' },
        { label: 'Escolas',      rota: '/cadastros/escolas',   icone: 'apartment' },
        { label: 'Séries',       rota: '/cadastros/series',    icone: 'auto_stories' },
        { label: 'Empresas',     rota: '/cadastros/empresas',  icone: 'business' }
      ]
    },
    {
      titulo: 'Operacional',
      icone: 'bolt',
      itens: [
        {
          label: 'Orçamentos', icone: 'request_quote',
          subItens: [
            { label: 'Lista Escolar', rota: '/cotacoes/listas-escolares', icone: 'school' },
            { label: 'Configurações', rota: '/cotacoes/configuracoes', icone: 'tune' }
          ]
        },
        { label: 'Estoque',    rota: '/estoque',   icone: 'package_2', permissao: 'estoque:ler' },
        {
          label: 'Compras', icone: 'shopping_cart',
          subItens: [
            { label: 'Relatório', rota: '/compras', icone: 'trending_up', permissao: 'produtos:ler' },
            { label: 'Fornecedores', rota: '/compras/fornecedores', icone: 'storefront', permissao: 'produtos:ler' },
            { label: 'Pedidos', rota: '/compras/pedidos', icone: 'receipt_long', permissao: 'produtos:ler' }
          ]
        },
        { label: 'Albia IA',   rota: '/albia',     icone: 'auto_awesome', badge: 'NOVO' }
      ]
    },
    {
      titulo: 'WhatsApp',
      icone: 'forum',
      itens: [
        { label: 'Atendimentos', rota: '/whatsapp/atendimentos', icone: 'support_agent' }
      ]
    },
    {
      titulo: 'Financeiro',
      icone: 'payments',
      itens: [
        { label: 'Cartões', rota: '/financeiro/cartoes', icone: 'credit_card' }
      ]
    },
    {
      titulo: 'Administração',
      icone: 'admin_panel_settings',
      itens: [
        { label: 'Usuários',     rota: '/usuarios',     icone: 'group', permissao: 'usuarios:ler' },
        { label: 'Perfis',       rota: '/perfis',       icone: 'shield', permissao: 'perfis:ler' },
        { label: 'Relatórios',   rota: '/relatorios',   icone: 'bar_chart', permissao: 'relatorios:ler' },
        { label: 'Configurações',rota: '/configuracoes',icone: 'settings', permissao: 'configuracoes:ler' }
      ]
    },
    {
      titulo: 'Integrações',
      icone: 'integration_instructions',
      itens: [
        { label: 'ERP Tiny', rota: '/integracoes/tiny', icone: 'dashboard' }
      ]
    }
  ];

  gruposVisiveis = computed<GrupoMenu[]>(() => {
    const permitido = (item: ItemMenu): boolean =>
      !item.permissao || this.auth.temPermissao(item.permissao);

    const filtrarItens = (itens: ItemMenu[]): ItemMenu[] =>
      itens
        .filter(permitido)
        .map(item => item.subItens ? { ...item, subItens: filtrarItens(item.subItens) } : item)
        .filter(item => !item.subItens || item.subItens.length > 0);

    const ehAdministrador = this.usuario()?.perfis?.includes('Administrador') ?? false;

    return this.grupos
      .filter(grupo => grupo.titulo !== 'Visão geral' || ehAdministrador)
      .map(grupo => ({ ...grupo, itens: filtrarItens(grupo.itens) }))
      .filter(grupo => grupo.itens.length > 0);
  });

  grupoExibido = computed<GrupoMenu | null>(() => {
    const titulo = this.contextoHover();
    if (!titulo) return null;
    return this.gruposVisiveis().find(g => g.titulo === titulo) ?? null;
  });

  usuario    = this.auth.usuario;
  usuarioMenuAberto = signal(false);

  iniciais = computed(() => {
    const u = this.usuario();
    if (!u?.nome) return '?';
    const partes = u.nome.trim().split(/\s+/);
    const ini = partes.length >= 2
      ? partes[0][0] + partes[partes.length - 1][0]
      : partes[0].slice(0, 2);
    return ini.toUpperCase();
  });

  private carregarFixado(): boolean {
    try {
      return localStorage.getItem(CHAVE_LOCALSTORAGE_FIXADO) === 'true';
    } catch {
      return false;
    }
  }

  alternarFixado(fixar: boolean): void {
    this.fixado.set(fixar);
    try { localStorage.setItem(CHAVE_LOCALSTORAGE_FIXADO, String(fixar)); } catch { }
  }

  aoHoverContexto(titulo: string): void {
    this.contextoHover.set(titulo);
  }

  aoSairAreaMenu(): void {
    this.contextoHover.set(null);
  }

  aoClicarItem(): void {
    this.contextoHover.set(null);
  }

  toggleItem(label: string): void {
    const sig = this.expandidosPorItem.get(label) ?? signal(true);
    sig.set(!sig());
    this.expandidosPorItem.set(label, sig);
  }

  itemExpandido(label: string): boolean {
    const sig = this.expandidosPorItem.get(label);
    return sig ? sig() : true;
  }

  toggleUsuarioMenu(): void {
    this.usuarioMenuAberto.update(v => !v);
  }

  fecharUsuarioMenu(): void {
    this.usuarioMenuAberto.set(false);
  }

  irParaMeuPerfil(): void {
    this.fecharUsuarioMenu();
    this.router.navigate(['/meu-perfil']);
  }

  irParaConfiguracoes(): void {
    this.fecharUsuarioMenu();
    this.router.navigate(['/configuracoes']);
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
