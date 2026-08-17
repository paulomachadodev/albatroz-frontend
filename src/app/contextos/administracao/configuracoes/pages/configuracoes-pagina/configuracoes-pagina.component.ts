import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfiguracoesService } from '../../services/configuracoes.service';
import { Configuracao } from '../../models/configuracao.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

type Aba = 'email';

@Component({
  selector: 'app-configuracoes-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent],
  templateUrl: './configuracoes-pagina.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ConfiguracoesPaginaComponent implements OnInit {
  abaAtiva = signal<Aba>('email');
  carregando = signal(true);
  salvando = signal(false);

  smtpHost = '';
  smtpPort = '465';
  smtpSsl = true;
  smtpUsuario = '';
  smtpSenha = '';
  smtpRemetente = '';
  smtpNomeRemetente = '';
  senhaJaConfigurada = false;

  constructor(
    private configuracoesService: ConfiguracoesService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.configuracoesService.listar().subscribe({
      next: res => {
        const configs = res.dados ?? [];
        const mapa = new Map(configs.map(c => [c.chave, c.valor] as [string, string | undefined]));

        this.smtpHost = mapa.get('smtp_host') ?? '';
        this.smtpPort = mapa.get('smtp_port') ?? '465';
        this.smtpSsl = (mapa.get('smtp_ssl') ?? 'true') !== 'false';
        this.smtpUsuario = mapa.get('smtp_usuario') ?? '';
        this.smtpRemetente = mapa.get('smtp_remetente') ?? '';
        this.smtpNomeRemetente = mapa.get('smtp_nome_remetente') ?? '';
        this.senhaJaConfigurada = !!mapa.get('smtp_senha');
        this.smtpSenha = '';

        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as configurações.');
        this.carregando.set(false);
      }
    });
  }

  salvarEmail() {
    if (!this.smtpHost.trim() || !this.smtpUsuario.trim()) {
      this.toast.erro('Servidor SMTP e usuário são obrigatórios.');
      return;
    }

    this.salvando.set(true);

    const chamadas = [
      this.configuracoesService.atualizar('smtp_host', this.smtpHost.trim()),
      this.configuracoesService.atualizar('smtp_port', this.smtpPort.trim() || '465'),
      this.configuracoesService.atualizar('smtp_ssl', String(this.smtpSsl)),
      this.configuracoesService.atualizar('smtp_usuario', this.smtpUsuario.trim()),
      this.configuracoesService.atualizar('smtp_remetente', this.smtpRemetente.trim() || this.smtpUsuario.trim()),
      this.configuracoesService.atualizar('smtp_nome_remetente', this.smtpNomeRemetente.trim() || 'Albatroz Papelaria')
    ];

    if (this.smtpSenha.trim()) {
      chamadas.push(this.configuracoesService.atualizar('smtp_senha', this.smtpSenha.trim()));
    }

    forkJoin(chamadas).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Configurações de e-mail salvas.');
        this.carregar();
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar as configurações de e-mail.');
      }
    });
  }
}
