import { Component, inject, input, output, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

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
  icone?: string;
  colapsavel?: boolean;
  itens: ItemMenu[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  private auth = inject(AuthService);

  colapsada = input<boolean>(false);
  toggle    = output<void>();

  private expandidosPorGrupo = new Map<string, ReturnType<typeof signal<boolean>>>();
  private expandidosPorItem  = new Map<string, ReturnType<typeof signal<boolean>>>();

  grupos: GrupoMenu[] = [
    {
      titulo: 'Visão geral',
      itens: [
        { label: 'Dashboard',  rota: '/dashboard', icone: 'dashboard' }
      ]
    },
    {
      titulo: 'Operacional',
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
      titulo: 'Cadastros',
      itens: [
        { label: 'Produtos',     rota: '/produtos',            icone: 'inventory_2', permissao: 'produtos:ler' },
        { label: 'Contatos',     rota: '/cadastros/contatos',  icone: 'contacts' },
        { label: 'Escolas',      rota: '/cadastros/escolas',   icone: 'apartment' },
        { label: 'Séries',       rota: '/cadastros/series',    icone: 'auto_stories' },
        { label: 'Empresas',     rota: '/cadastros/empresas',  icone: 'business' }
      ]
    },
    {
      titulo: 'WhatsApp',
      itens: [
        {
          label: 'WhatsApp', icone: 'forum',
          subItens: [
            { label: 'Atendimentos', rota: '/whatsapp/atendimentos', icone: 'support_agent' }
          ]
        }
      ]
    },
    {
      titulo: 'Financeiro',
      itens: [
        { label: 'Cartões', rota: '/financeiro/cartoes', icone: 'credit_card' }
      ]
    },
    {
      titulo: 'Administração',
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
      colapsavel: true,
      itens: [
        { label: 'ERP Tiny', rota: '/integracoes/tiny', icone: 'dashboard' }
      ]
    }
  ];

  constructor() {
    this.grupos.forEach(grupo => {
      if (grupo.colapsavel) {
        this.expandidosPorGrupo.set(grupo.titulo, signal(false));
      }
    });
  }

  expandirGrupo(titulo: string): void {
    const sig = this.expandidosPorGrupo.get(titulo);
    if (sig) sig.set(true);
  }

  recolherGrupo(titulo: string): void {
    const sig = this.expandidosPorGrupo.get(titulo);
    if (sig) sig.set(false);
  }

  grupoExpandido(titulo: string): boolean {
    const sig = this.expandidosPorGrupo.get(titulo);
    return sig ? sig() : true;
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

  gruposVisiveis = computed<GrupoMenu[]>(() => {
    const permitido = (item: ItemMenu): boolean =>
      !item.permissao || this.auth.temPermissao(item.permissao);

    const filtrarItens = (itens: ItemMenu[]): ItemMenu[] =>
      itens
        .filter(permitido)
        .map(item => item.subItens ? { ...item, subItens: filtrarItens(item.subItens) } : item)
        .filter(item => !item.subItens || item.subItens.length > 0);

    return this.grupos
      .map(grupo => ({ ...grupo, itens: filtrarItens(grupo.itens) }))
      .filter(grupo => grupo.itens.length > 0);
  });
}
