import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  menuAberto = signal(false);
  usuario    = this.auth.usuario;

  iniciais = computed(() => {
    const u = this.usuario();
    if (!u?.nome) return '?';
    const partes = u.nome.trim().split(/\s+/);
    const ini = partes.length >= 2
      ? partes[0][0] + partes[partes.length - 1][0]
      : partes[0].slice(0, 2);
    return ini.toUpperCase();
  });

  toggleMenu(): void {
    this.menuAberto.update(v => !v);
  }

  fechar(): void {
    this.menuAberto.set(false);
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
