import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { MeuPerfilService } from '../../services/meu-perfil.service';

@Component({
  selector: 'app-meu-perfil-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent],
  templateUrl: './meu-perfil-pagina.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class MeuPerfilPaginaComponent {
  private auth = inject(AuthService);
  private meuPerfilService = inject(MeuPerfilService);
  private toast = inject(ToastService);

  usuario = this.auth.usuario;

  senhaAtual = '';
  novaSenha = '';
  confirmarNovaSenha = '';
  salvando = signal(false);

  salvarSenha() {
    if (!this.senhaAtual || !this.novaSenha || !this.confirmarNovaSenha) {
      this.toast.erro('Preencha senha atual, nova senha e confirmação.');
      return;
    }

    if (this.novaSenha !== this.confirmarNovaSenha) {
      this.toast.erro('Nova senha e confirmação não coincidem.');
      return;
    }

    this.salvando.set(true);
    this.meuPerfilService.alterarSenha({
      senhaAtual: this.senhaAtual,
      novaSenha: this.novaSenha,
      confirmarNovaSenha: this.confirmarNovaSenha
    }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Senha alterada.');
        this.senhaAtual = '';
        this.novaSenha = '';
        this.confirmarNovaSenha = '';
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível alterar a senha.');
      }
    });
  }
}
