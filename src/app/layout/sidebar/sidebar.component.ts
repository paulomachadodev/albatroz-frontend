import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface ItemMenu {
  label: string;
  rota:  string;
  icone: string; // chave SVG inline
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  colapsada = input<boolean>(false);
  toggle    = output<void>();

  grupos: { titulo: string; itens: ItemMenu[] }[] = [
    {
      titulo: 'Visão geral',
      itens: [
        { label: 'Dashboard',  rota: '/dashboard', icone: 'home' }
      ]
    },
    {
      titulo: 'Operacional',
      itens: [
        { label: 'Produtos',   rota: '/produtos',  icone: 'box' },
        { label: 'Cotações',   rota: '/cotacoes',  icone: 'file-text' },
        { label: 'Estoque',    rota: '/estoque',   icone: 'layers' },
        { label: 'Albia IA',   rota: '/albia',     icone: 'sparkles', badge: 'NOVO' }
      ]
    },
    {
      titulo: 'Administração',
      itens: [
        { label: 'Usuários',     rota: '/usuarios',     icone: 'users' },
        { label: 'Perfis',       rota: '/perfis',       icone: 'shield' },
        { label: 'Relatórios',   rota: '/relatorios',   icone: 'chart' },
        { label: 'Configurações',rota: '/configuracoes',icone: 'settings' }
      ]
    }
  ];
}
