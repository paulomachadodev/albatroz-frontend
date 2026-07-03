import { Component, input, output, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface ItemMenu {
  label: string;
  rota:  string;
  icone: string; // nome Material Symbol
  badge?: string;
}

export interface GrupoMenu {
  titulo: string;
  icone?: string;        // ícone do grupo (para hover compacto)
  colapsavel?: boolean;  // habilita hover-expand
  itens: ItemMenu[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  colapsada = input<boolean>(false);
  toggle    = output<void>();

  private expandidosPorGrupo = new Map<string, ReturnType<typeof signal<boolean>>>();

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
        { label: 'Produtos',   rota: '/produtos',  icone: 'inventory_2' },
        { label: 'Cotações',   rota: '/cotacoes',  icone: 'request_quote' },
        { label: 'Estoque',    rota: '/estoque',   icone: 'package_2' },
        { label: 'Fornecedores', rota: '/fornecedores', icone: 'local_shipping' },
        { label: 'Albia IA',   rota: '/albia',     icone: 'auto_awesome', badge: 'NOVO' }
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
        { label: 'Usuários',     rota: '/usuarios',     icone: 'group' },
        { label: 'Perfis',       rota: '/perfis',       icone: 'shield' },
        { label: 'Relatórios',   rota: '/relatorios',   icone: 'bar_chart' },
        { label: 'Configurações',rota: '/configuracoes',icone: 'settings' }
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
    // Inicializar signals de expandido para cada grupo colapsável
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
}
