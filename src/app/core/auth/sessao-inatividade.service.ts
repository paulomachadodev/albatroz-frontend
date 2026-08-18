import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../feedback/toast.service';

const LIMITE_INATIVIDADE_MS = 6 * 60 * 60 * 1000; // 6h sem interação
const AVISO_ANTES_MS = 2 * 60 * 1000;
const INTERVALO_VERIFICACAO_MS = 60 * 1000;
const RENOVAR_SE_EXPIRA_EM_SEGUNDOS = 3 * 60;
const EVENTOS_ATIVIDADE = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'] as const;

@Injectable({ providedIn: 'root' })
export class SessaoInatividadeService {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private ultimaAtividade = Date.now();
  private iniciado = false;
  private avisoExibido = false;

  iniciar(): void {
    if (this.iniciado) return;
    this.iniciado = true;

    EVENTOS_ATIVIDADE.forEach(evento =>
      document.addEventListener(evento, () => {
        this.ultimaAtividade = Date.now();
        this.avisoExibido = false;
      }, { passive: true })
    );

    setInterval(() => this.verificar(), INTERVALO_VERIFICACAO_MS);
  }

  private verificar(): void {
    if (!this.auth.usuario()) return;

    const inativoPor = Date.now() - this.ultimaAtividade;
    if (inativoPor > LIMITE_INATIVIDADE_MS) {
      this.auth.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (!this.avisoExibido && inativoPor > LIMITE_INATIVIDADE_MS - AVISO_ANTES_MS) {
      this.avisoExibido = true;
      this.toast.aviso('Sessão prestes a expirar', 'Sem uso há quase 1h — mexa na tela pra continuar conectado.');
    }

    if (this.auth.getRefreshToken() && this.auth.expiraEmBreve(RENOVAR_SE_EXPIRA_EM_SEGUNDOS)) {
      this.auth.renovar().subscribe({ error: () => void 0 });
    }
  }
}
