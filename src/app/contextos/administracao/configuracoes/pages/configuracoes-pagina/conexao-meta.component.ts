import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { AplicativoMeta, ConexaoSocial, SITUACOES_CONEXAO, TIPOS_ATIVO } from '../../models/conexao-meta.model';
import { ConexaoMetaService } from '../../services/conexao-meta.service';

@Component({
  selector: 'app-conexao-meta',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ModalComponent],
  templateUrl: './conexao-meta.component.html'
})
export class ConexaoMetaComponent {
  private readonly service = inject(ConexaoMetaService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly empresa = this.auth.empresaIdAtual();
  private readonly usuario = this.auth.usuario()?.id;
  private consultas: Subscription[] = [];
  readonly acesso = computed(() => this.auth.empresaIdAtual() === this.empresa && this.auth.usuario()?.id === this.usuario && this.auth.temPermissao('integracoes_sociais:ler'));
  readonly podeCriar = computed(() => this.acesso() && this.auth.temPermissao('integracoes_sociais:criar'));
  readonly podeEditar = computed(() => this.acesso() && this.auth.temPermissao('integracoes_sociais:editar'));
  readonly podeExcluir = computed(() => this.acesso() && this.auth.temPermissao('integracoes_sociais:excluir'));
  readonly carregando = signal(true);
  readonly ocupado = signal(false);
  readonly habilitado = signal(false);
  readonly aplicativo = signal<AplicativoMeta | null>(null);
  readonly conexao = signal<ConexaoSocial | null>(null);
  readonly selecao = signal<Set<number>>(new Set());
  readonly confirmarDesconexao = signal(false);
  readonly uriCopiada = signal(false);
  readonly situacoes = SITUACOES_CONEXAO;
  readonly tipos = TIPOS_ATIVO;
  readonly form = inject(FormBuilder).nonNullable.group({
    appId: ['', [Validators.required, Validators.pattern(/^[0-9]{5,30}$/)]],
    configId: ['', Validators.pattern(/^([0-9]{5,40})?$/)],
    appSecret: ['', Validators.pattern(/^([A-Za-z0-9_-]{16,128})?$/)]
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.consultas.forEach(c => c.unsubscribe()));
    effect(() => {
      if (this.acesso()) return;
      this.consultas.forEach(c => c.unsubscribe());
      this.aplicativo.set(null);
      this.receberConexao(null);
      this.form.reset();
      this.carregando.set(false);
      this.ocupado.set(false);
      this.confirmarDesconexao.set(false);
    });
    this.carregar();
  }

  private rastrear(assinatura: Subscription): void {
    this.consultas.push(assinatura);
  }

  carregar(): void {
    if (!this.acesso()) return;
    this.consultas.forEach(c => c.unsubscribe());
    this.carregando.set(true);
    this.consultas = [
      this.service.obterAplicativo().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: res => { if (this.acesso() && res.sucesso && res.dados) this.receberAplicativo(res.dados); },
        error: erro => this.toast.erroServidor(erro, 'Não foi possível consultar o aplicativo Meta.')
      }),
      this.service.obterConexao().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: res => {
          if (!this.acesso()) return;
          this.carregando.set(false);
          if (res.sucesso && res.dados) { this.habilitado.set(res.dados.habilitado); this.receberConexao(res.dados.conexao); }
        },
        error: erro => { this.carregando.set(false); this.toast.erroServidor(erro, 'Não foi possível consultar a conexão Meta.'); }
      })
    ];
  }

  salvarAplicativo(): void {
    this.form.markAllAsTouched();
    const atual = this.aplicativo();
    const valores = this.form.getRawValue();
    if (!this.podeEditar() || this.ocupado() || this.form.invalid || !atual) return;
    if (!atual.configurado && !valores.appSecret) {
      this.toast.aviso('Informe o App Secret.', 'No primeiro cadastro o segredo é obrigatório.');
      return;
    }
    this.ocupado.set(true);
    this.rastrear(this.service.salvarAplicativo({
      appId: valores.appId.trim(), appSecret: valores.appSecret.trim() || null,
      configId: valores.configId.trim() || null, versaoEsperada: atual.versao
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.ocupado.set(false);
        if (res.sucesso && res.dados) { this.receberAplicativo(res.dados); this.toast.sucesso('Aplicativo Meta salvo.'); }
        else this.toast.erro('Não foi possível salvar o aplicativo.');
      },
      error: erro => { this.ocupado.set(false); this.toast.erroServidor(erro, 'Não foi possível salvar o aplicativo.'); }
    }));
  }

  conectar(): void {
    if (!this.podeCriar() || this.ocupado() || !this.aplicativo()?.configurado) return;
    this.ocupado.set(true);
    this.rastrear(this.service.iniciar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (res.sucesso && res.dados?.urlAutorizacao.startsWith('https://www.facebook.com/')) {
          window.location.assign(res.dados.urlAutorizacao);
          return;
        }
        this.ocupado.set(false);
        this.toast.erro('Não foi possível iniciar a conexão.');
      },
      error: erro => { this.ocupado.set(false); this.toast.erroServidor(erro, 'Não foi possível iniciar a conexão.'); }
    }));
  }

  alternar(id: number): void {
    if (!this.podeEditar()) return;
    const proxima = new Set(this.selecao());
    if (!proxima.delete(id)) proxima.add(id);
    this.selecao.set(proxima);
  }

  selecaoAlterada(): boolean {
    const conexao = this.conexao();
    if (!conexao) return false;
    const atuais = conexao.ativos.filter(a => a.selecionado).map(a => a.id).sort((a, b) => a - b).join(',');
    return atuais !== [...this.selecao()].sort((a, b) => a - b).join(',');
  }

  salvarSelecao(): void {
    const conexao = this.conexao();
    if (!conexao || !this.podeEditar() || this.ocupado()) return;
    this.ocupado.set(true);
    this.rastrear(this.service.selecionarAtivos([...this.selecao()], conexao.versao).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.ocupado.set(false);
        if (res.sucesso && res.dados) { this.receberConexao(res.dados); this.toast.sucesso('Seleção salva.'); }
        else this.toast.erro('Não foi possível salvar a seleção.');
      },
      error: erro => { this.ocupado.set(false); this.toast.erroServidor(erro, 'Não foi possível salvar a seleção.'); }
    }));
  }

  desconectar(): void {
    if (!this.podeExcluir() || this.ocupado()) return;
    this.ocupado.set(true);
    this.rastrear(this.service.desconectar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.ocupado.set(false); this.confirmarDesconexao.set(false); this.receberConexao(null); this.toast.sucesso('Conexão removida.'); },
      error: erro => { this.ocupado.set(false); this.toast.erroServidor(erro, 'Não foi possível desconectar.'); }
    }));
  }

  async copiarUri(): Promise<void> {
    const uri = this.aplicativo()?.uriRetorno;
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      this.uriCopiada.set(true);
      setTimeout(() => this.uriCopiada.set(false), 2000);
    } catch {
      this.toast.aviso('Copie o endereço manualmente.');
    }
  }

  private receberAplicativo(dados: AplicativoMeta): void {
    this.aplicativo.set(dados);
    this.form.reset({ appId: dados.appId ?? '', configId: dados.configId ?? '', appSecret: '' });
    if (!this.podeEditar()) this.form.disable({ emitEvent: false });
  }

  private receberConexao(conexao: ConexaoSocial | null): void {
    this.conexao.set(conexao);
    this.selecao.set(new Set((conexao?.ativos ?? []).filter(a => a.selecionado).map(a => a.id)));
  }
}
