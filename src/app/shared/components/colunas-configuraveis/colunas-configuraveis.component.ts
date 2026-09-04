import { Component, input, output, signal } from '@angular/core';
import { DrawerComponent } from '../drawer/drawer.component';
import { ToggleComponent } from '../toggle/toggle.component';
import { BtnIconeComponent } from '../btn-icone/btn-icone.component';

export interface ColunaConfiguravel {
  chave: string;
  rotulo: string;
}

@Component({
  selector: 'app-colunas-configuraveis',
  standalone: true,
  imports: [DrawerComponent, ToggleComponent, BtnIconeComponent],
  templateUrl: './colunas-configuraveis.component.html',
  host: { class: 'inline-block' }
})
export class ColunasConfiguraveisComponent {
  colunas = input.required<ColunaConfiguravel[]>();
  visiveis = input.required<Set<string>>();
  visivelMudou = output<{ chave: string; visivel: boolean }>();

  drawerAberto = signal(false);

  abrir() {
    this.drawerAberto.set(true);
  }

  fechar() {
    this.drawerAberto.set(false);
  }

  estaVisivel(chave: string): boolean {
    return this.visiveis().has(chave);
  }

  alternar(chave: string, visivel: boolean) {
    this.visivelMudou.emit({ chave, visivel });
  }
}
