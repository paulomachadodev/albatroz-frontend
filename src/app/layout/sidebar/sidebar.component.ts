import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface ItemMenu {
  label: string;
  rota:  string;
  icone: string; // nome Material Symbol
  badge?: string;
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

  grupos: { titulo: string; itens: ItemMenu[] }[] = [
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
    }
  ];
}
