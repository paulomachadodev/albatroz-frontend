import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import {
  MercadoLivreEstado, SITUACAO_CONEXAO_MARKETPLACE_CONECTADA, SITUACOES_CONEXAO_MARKETPLACE, URL_AUTORIZACAO_MERCADO_LIVRE
} from '../../models/mercado-livre.model';
import { MercadoLivreService } from '../../services/mercado-livre.service';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';

@Component({
  selector: 'app-configuracao-mercado-livre',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './mercado-livre-configuracao.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class MercadoLivreConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
  private readonly service = inject(MercadoLivreService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogoConfirmacao = inject(ConfirmService);
  private readonly rota = inject(ActivatedRoute);
  private readonly navegador = inject(Router);
  readonly acesso = computed(() => this.contextoValido() && this.auth.temPermissao('integracoes_marketplace:ler'));
  readonly podeCriar = computed(() => this.acesso() && this.auth.temPermissao('integracoes_marketplace:criar'));
  readonly podeExcluir = computed(() => this.acesso() && this.auth.temPermissao('integracoes_marketplace:excluir'));
  readonly carregando = signal(true);
  readonly erroCarregamento = signal(false);
  readonly ocupado = signal(false);
  readonly estado = signal<MercadoLivreEstado | null>(null);
  readonly editandoApp = signal(false);
  readonly uriCopiada = signal(false);
  readonly mostrarFormulario = computed(() => !this.estado()?.aplicativoConfigurado || this.editandoApp());
  readonly conectada = computed(() => this.estado()?.conexao?.situacao === SITUACAO_CONEXAO_MARKETPLACE_CONECTADA);
  readonly situacaoTexto = computed(() => {
    const conexao = this.estado()?.conexao;
    return conexao ? SITUACOES_CONEXAO_MARKETPLACE[conexao.situacao] ?? 'Com erro' : 'Não conectado';
  });
  readonly form = inject(FormBuilder).nonNullable.group({
    appId: ['', [Validators.required, Validators.pattern(/^[0-9]{5,30}$/)]],
    clientSecret: ['', Validators.pattern(/^([A-Za-z0-9_-]{16,128})?$/)]
  });

  constructor() {
    super();
    this.permissaoEdicao = 'integracoes_marketplace:editar';
  }

  ngOnInit(): void {
    const parametros = this.rota.snapshot.queryParamMap;
    const state = parametros.get('state');
    if (!state) {
      this.carregar();
      return;
    }
    const codigo = parametros.get('code');
    const erroProvedor = parametros.get('error') ?? parametros.get('error_description');
    void this.navegador.navigate([], { queryParams: {}, replaceUrl: true });
    this.service.concluir({ codigo, state, erroProvedor }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (res.sucesso && res.dados) {
          this.receber(res.dados);
          this.carregando.set(false);
          this.toast.sucesso('Conta do Mercado Livre conectada.');
          return;
        }
        this.falharRetorno('Não foi possível concluir a conexão.');
      },
      error: erro => this.falharRetorno(this.toast.mensagemServidor(erro, 'Não foi possível concluir a conexão.'))
    });
  }

  carregar(): void {
    if (!this.acesso()) { this.carregando.set(false); return; }
    this.erroCarregamento.set(false);
    this.service.obterEstado().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (res.sucesso && res.dados) this.receber(res.dados);
        else this.erroCarregamento.set(true);
        this.carregando.set(false);
      },
      error: erro => {
        this.erroCarregamento.set(true);
        this.carregando.set(false);
        this.toast.erroServidor(erro, 'Não foi possível consultar a integração.');
      }
    });
  }

  tentarNovamente(): void {
    this.carregando.set(true);
    this.carregar();
  }

  salvarAplicativo(): void {
    this.form.markAllAsTouched();
    const atual = this.estado();
    const valores = this.form.getRawValue();
    if (!this.podeEditar() || this.ocupado() || this.form.invalid || !atual) return;
    if (!atual.aplicativoConfigurado && !valores.clientSecret) {
      this.toast.aviso('Informe a Secret Key.', 'No primeiro cadastro ela é obrigatória.');
      return;
    }
    this.ocupado.set(true);
    this.service.salvarAplicativo({
      appId: valores.appId.trim(), clientSecret: valores.clientSecret.trim() || null, versaoEsperada: atual.versao
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.ocupado.set(false);
        if (res.sucesso && res.dados) {
          this.receber(res.dados);
          this.editandoApp.set(false);
          this.marcarSalvo();
          this.toast.sucesso('Credenciais salvas.');
        } else this.toast.erro('Não foi possível salvar as credenciais.');
      },
      error: erro => {
        this.ocupado.set(false);
        this.toast.erroServidor(erro, 'Não foi possível salvar as credenciais.');
        if (erro instanceof HttpErrorResponse && erro.status === 409) this.carregar();
      }
    });
  }

  cancelarEdicao(): void {
    this.form.reset({ appId: this.estado()?.appId ?? '', clientSecret: '' });
    this.editandoApp.set(false);
    this.marcarSalvo();
  }

  testar(): void {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.service.testar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.ocupado.set(false);
        if (res.sucesso && res.dados) this.toast.sucesso(res.dados.mensagem);
      },
      error: erro => { this.ocupado.set(false); this.toast.erroServidor(erro, 'Não foi possível testar as credenciais.'); }
    });
  }

  conectar(): void {
    if (!this.podeCriar() || this.ocupado() || !this.estado()?.aplicativoConfigurado) return;
    this.ocupado.set(true);
    this.service.iniciar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (res.sucesso && res.dados?.urlAutorizacao.startsWith(URL_AUTORIZACAO_MERCADO_LIVRE)) {
          window.location.assign(res.dados.urlAutorizacao);
          return;
        }
        this.ocupado.set(false);
        this.toast.erro('Não foi possível iniciar a conexão.');
      },
      error: erro => { this.ocupado.set(false); this.toast.erroServidor(erro, 'Não foi possível iniciar a conexão.'); }
    });
  }

  async desconectar(): Promise<void> {
    if (!this.podeExcluir() || this.ocupado()) return;
    const confirmado = await this.dialogoConfirmacao.confirmar(
      'Desconectar do Mercado Livre?',
      'O acesso guardado no ERP é removido. Anúncios e pedidos deixam de sincronizar até você conectar de novo.',
      { textoConfirmar: 'Desconectar' }
    );
    if (!confirmado) return;
    this.ocupado.set(true);
    this.service.desconectar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.ocupado.set(false);
        this.estado.update(atual => atual ? { ...atual, conexao: null } : atual);
        this.toast.sucesso('Conta desconectada.');
      },
      error: erro => { this.ocupado.set(false); this.toast.erroServidor(erro, 'Não foi possível desconectar.'); }
    });
  }

  async copiarUri(): Promise<void> {
    const uri = this.estado()?.uriRetorno;
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      this.uriCopiada.set(true);
      setTimeout(() => this.uriCopiada.set(false), 2000);
    } catch {
      this.toast.aviso('Copie o endereço manualmente.');
    }
  }

  private falharRetorno(mensagem: string): void {
    this.toast.erro('Conexão não concluída.', mensagem);
    this.carregar();
  }

  private receber(dados: MercadoLivreEstado): void {
    this.estado.set(dados);
    this.form.reset({ appId: dados.appId ?? '', clientSecret: '' });
    if (!this.podeEditar()) this.form.disable({ emitEvent: false });
  }
}
