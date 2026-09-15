import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessaoInatividadeService } from './core/auth/sessao-inatividade.service';
import { ThemeService } from './core/theme/theme.service';
import { AtualizacaoAppService } from './core/pwa/atualizacao-app.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'albatroz-frontend';

  constructor() {
    inject(SessaoInatividadeService).iniciar();
    inject(ThemeService);
    inject(AtualizacaoAppService).iniciar();
  }
}
