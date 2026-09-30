import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { CampoHintComponent } from '../../../../../shared/components/campo-hint/campo-hint.component';
import { SpinnerComponent } from '../../../../../shared/components/spinner/spinner.component';
import { IntegracoesService } from '../../services/integracoes.service';
import { IntegracaoTiny, SalvarIntegracaoTinyRequisicao, StatusConexaoTiny } from '../../models/integracao-tiny.model';

@Component({
  selector: 'app-integracoes',
  standalone: true,
  imports: [
    FormsModule, RouterLink, DatePipe, PageHeaderComponent, BreadcrumbComponent, CampoHintComponent, SpinnerComponent
  ],
  templateUrl: './integracoes.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class IntegracoesComponent implements OnInit {
  private service = inject(IntegracoesService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  carregando = signal(true);
  salvando = signal(false);
  removendo = signal(false);
  integracao = signal<IntegracaoTiny | null>(null);
  erroFormulario = signal<string | null>(null);

  clientId = '';
  clientSecret = '';
  refreshToken = '';

  podeEditar = computed(() => this.auth.temPermissao('configuracoes:editar'));
  configurada = computed(() => this.integracao()?.configurada === true);

  ngOnInit() {
    this.service.obterTiny().subscribe({
      next: resposta => {
        this.aplicar(resposta.dados ?? null);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar a integração.');
        this.carregando.set(false);
      }
    });
  }

  rotuloStatus(status: StatusConexaoTiny): string {
    if (status === 'conectada') return 'Conectada';
    if (status === 'erro') return 'Erro';
    return 'Não validada';
  }

  classeStatus(status: StatusConexaoTiny): string {
    if (status === 'conectada') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (status === 'erro') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }

  formularioValido(): boolean {
    if (!this.clientId.trim()) return false;
    if (this.configurada()) return true;
    return !!this.clientSecret.trim() && !!this.refreshToken.trim();
  }

  salvar() {
    if (!this.formularioValido() || this.salvando()) return;
    this.salvando.set(true);
    this.erroFormulario.set(null);

    const requisicao: SalvarIntegracaoTinyRequisicao = { clientId: this.clientId.trim() };
    if (this.clientSecret.trim()) requisicao.clientSecret = this.clientSecret.trim();
    if (this.refreshToken.trim()) requisicao.refreshToken = this.refreshToken.trim();

    this.service.salvarTiny(requisicao).subscribe({
      next: resposta => {
        this.aplicar(resposta.dados ?? null);
        this.salvando.set(false);
        const status = resposta.dados?.statusConexao;
        if (status === 'erro') {
          this.toast.aviso('Integração salva, mas a conexão falhou.', resposta.dados?.mensagemErro ?? undefined);
        } else {
          this.toast.sucesso('Integração salva e conexão testada.');
        }
      },
      error: err => {
        const mensagem = this.toast.mensagemServidor(err, 'Não foi possível salvar a integração.');
        this.erroFormulario.set(mensagem);
        this.toast.erro('Erro', mensagem);
        this.salvando.set(false);
      }
    });
  }

  async remover() {
    const confirmado = await this.confirm.confirmar(
      'Remover integração com o Tiny ERP?',
      'As credenciais salvas serão apagadas e a sincronização com o Tiny deixa de funcionar até você configurar de novo.',
      { textoConfirmar: 'Remover' }
    );
    if (!confirmado) return;

    this.removendo.set(true);
    this.service.removerTiny().subscribe({
      next: () => {
        this.aplicar(null);
        this.erroFormulario.set(null);
        this.removendo.set(false);
        this.toast.sucesso('Integração removida.');
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível remover a integração.');
        this.removendo.set(false);
      }
    });
  }

  private aplicar(dados: IntegracaoTiny | null) {
    this.integracao.set(dados);
    this.clientId = dados?.clientId ?? '';
    this.clientSecret = '';
    this.refreshToken = '';
  }
}
