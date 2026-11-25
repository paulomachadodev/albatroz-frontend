import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, interval, takeUntil } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { BtnIconeComponent } from '../../../../../shared/components/btn-icone/btn-icone.component';
import { CampoMascaraComponent } from '../../../../../shared/components/campo-mascara/campo-mascara.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ToggleComponent } from '../../../../../shared/components/toggle/toggle.component';
import {
  AlbiaConfig, ContatoBloqueado, MOTOR_WAHA, MotorWaha, SITUACAO_WAHA, WahaConexao, WahaStatus,
  apresentarStatusWaha, formatarNumeroWaha, normalizarTelefoneBloqueio
} from '../../models/waha.model';
import { WahaService } from '../../services/waha.service';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';

type AbaWaha = 'conexao' | 'albia' | 'avancado';
type ModoConexao = 'qr' | 'codigo';
type TipoIdentificador = 'telefone' | 'lid';

const INTERVALO_MS = 3000;
const TICKS_STATUS_EM_REPOUSO = 5;
const TICKS_QR = 3;
const PADRAO_LID = /^\d{5,30}@lid$/i;

@Component({
  selector: 'app-configuracao-waha', standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, InputTextModule, BreadcrumbComponent, PageHeaderComponent, ModalComponent, ToggleComponent, BtnIconeComponent, CampoMascaraComponent],
  templateUrl: './waha-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class WahaConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
  private readonly service = inject(WahaService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  protected override permissaoEdicao = 'waha:editar';
  private tick = 0;

  readonly motores = [{ valor: MOTOR_WAHA.Noweb, nome: 'NOWEB (recomendado)' }, { valor: MOTOR_WAHA.Webjs, nome: 'WEBJS (navegador)' }];
  readonly SITUACAO = SITUACAO_WAHA;
  readonly aba = signal<AbaWaha>('conexao');
  readonly carregando = signal(true);
  readonly processando = signal(false);
  readonly conexao = signal<WahaConexao | null>(null);
  readonly status = signal<WahaStatus | null>(null);
  readonly albia = signal<AlbiaConfig | null>(null);
  readonly bloqueados = signal<ContatoBloqueado[]>([]);
  readonly modalConectar = signal(false);
  readonly modoConexao = signal<ModoConexao>('qr');
  readonly qrImagem = signal<string | null>(null);
  readonly qrMensagem = signal<string | null>(null);
  readonly codigo = signal<string | null>(null);
  readonly modalBloqueado = signal(false);
  readonly tipoIdentificador = signal<TipoIdentificador>('telefone');
  readonly apresentacao = computed(() => apresentarStatusWaha(this.status()));
  readonly conectado = computed(() => this.status()?.situacao === SITUACAO_WAHA.Conectado && this.status()?.configurada === true);
  readonly configurada = computed(() => this.conexao()?.configurada === true);
  readonly podeExcluir = computed(() => this.contextoValido() && this.auth.temPermissao('waha:excluir'));
  readonly numeroFormatado = formatarNumeroWaha;

  readonly formAvancado = this.fb.nonNullable.group({
    urlBase: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/^https?:\/\/\S+$/i)]],
    sessao: ['default', [Validators.required, Validators.maxLength(60), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    chaveApi: ['', [Validators.minLength(8), Validators.maxLength(128), Validators.pattern(/^\S+$/)]],
    motor: [MOTOR_WAHA.Noweb as MotorWaha]
  });
  readonly formTelefone = this.fb.nonNullable.group({ telefone: ['', [Validators.required, Validators.minLength(10)]] });
  readonly formPausa = this.fb.nonNullable.group({ minutos: [60, [Validators.required, Validators.min(1), Validators.max(1440)]] });
  readonly formBloqueado = this.fb.nonNullable.group({
    telefone: [''],
    lid: [''],
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    motivo: ['', [Validators.maxLength(200)]]
  });

  constructor() {
    super();
    effect(() => {
      if (!this.contextoValido()) {
        this.formAvancado.reset({ urlBase: '', sessao: 'default', chaveApi: '', motor: MOTOR_WAHA.Noweb });
        this.conexao.set(null);
        this.status.set(null);
      }
    });
    this.destroyRef.onDestroy(() => this.formAvancado.controls.chaveApi.reset(''));
  }

  ngOnInit(): void {
    this.carregarTudo();
    interval(INTERVALO_MS).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.aoTick());
  }

  trocarAba(aba: AbaWaha): void {
    this.aba.set(aba);
  }

  private carregarTudo(): void {
    this.service.obterConexao().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível carregar a conexão do WhatsApp.'); return; }
        this.aplicarConexao(resposta.dados);
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar a conexão do WhatsApp.')
    });
    this.atualizarStatus();
    this.carregarAlbia();
    this.carregarBloqueados();
  }

  private aplicarConexao(dados: WahaConexao): void {
    this.conexao.set(dados);
    this.formAvancado.reset({ urlBase: dados.urlBase ?? '', sessao: dados.sessao, chaveApi: '', motor: dados.motor });
    this.marcarSalvo();
  }

  private aoTick(): void {
    this.tick++;
    if (this.modalConectar()) {
      this.atualizarStatus();
      if (this.modoConexao() === 'qr' && this.tick % TICKS_QR === 0) this.carregarQr();
      return;
    }
    if (this.tick % TICKS_STATUS_EM_REPOUSO === 0) this.atualizarStatus();
  }

  atualizarStatus(): void {
    this.service.obterStatus().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) return;
        this.status.set(resposta.dados);
        if (this.modalConectar() && resposta.dados.situacao === SITUACAO_WAHA.Conectado) {
          this.fecharConectar();
          this.toast.sucesso('WhatsApp conectado.');
        }
      }
    });
  }

  conectar(): void {
    if (!this.podeEditar() || this.processando() || !this.configurada()) return;
    this.processando.set(true);
    this.service.iniciar().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível iniciar a conexão.'); return; }
        this.status.set(resposta.dados);
        this.abrirConectar();
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível iniciar a conexão.')
    });
  }

  private abrirConectar(): void {
    this.qrImagem.set(null);
    this.qrMensagem.set(null);
    this.codigo.set(null);
    this.modoConexao.set('qr');
    this.formTelefone.reset({ telefone: '' });
    this.tick = 0;
    this.modalConectar.set(true);
    this.carregarQr();
  }

  fecharConectar(): void {
    this.modalConectar.set(false);
    this.qrImagem.set(null);
    this.codigo.set(null);
    this.formTelefone.reset({ telefone: '' });
  }

  trocarModo(modo: ModoConexao): void {
    this.modoConexao.set(modo);
    if (modo === 'qr') this.carregarQr();
  }

  carregarQr(): void {
    if (!this.modalConectar() || this.status()?.situacao === SITUACAO_WAHA.Conectado) return;
    this.service.obterQr().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) return;
        this.qrImagem.set(`data:image/png;base64,${resposta.dados.imagemBase64}`);
        this.qrMensagem.set(null);
      },
      error: erro => {
        this.qrImagem.set(null);
        this.qrMensagem.set(this.toast.mensagemServidor(erro, 'O WhatsApp ainda não gerou o código. Aguarde alguns segundos.'));
      }
    });
  }

  gerarCodigo(): void {
    this.formTelefone.markAllAsTouched();
    if (this.formTelefone.invalid || this.processando()) return;
    this.processando.set(true);
    const telefone = normalizarTelefoneBloqueio(this.formTelefone.getRawValue().telefone);
    this.service.solicitarCodigo(telefone).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível gerar o código.'); return; }
        this.codigo.set(resposta.dados.codigo);
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível gerar o código.')
    });
  }

  reiniciar(): void {
    if (!this.podeEditar() || this.processando()) return;
    this.processando.set(true);
    this.service.reiniciar().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível reiniciar a conexão.'); return; }
        this.status.set(resposta.dados);
        this.toast.sucesso('Reiniciando a conexão do WhatsApp.');
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível reiniciar a conexão.')
    });
  }

  async desconectar(): Promise<void> {
    if (!this.podeExcluir() || this.processando()) return;
    const confirmado = await this.confirm.confirmar('Desconectar o WhatsApp?', 'A Albia e os envios automáticos param até você conectar de novo.', { textoConfirmar: 'Desconectar' });
    if (!confirmado || !this.podeExcluir() || this.processando()) return;
    this.processando.set(true);
    this.service.desconectar().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível desconectar.'); return; }
        this.status.set(resposta.dados);
        this.toast.sucesso('WhatsApp desconectado.');
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível desconectar.')
    });
  }

  salvarAvancado(): void {
    this.formAvancado.markAllAsTouched();
    if (!this.podeEditar() || this.processando() || this.formAvancado.invalid) return;
    const valores = this.formAvancado.getRawValue();
    if (!this.configurada() && !valores.chaveApi.trim()) { this.formAvancado.controls.chaveApi.setErrors({ required: true }); return; }
    this.processando.set(true);
    this.service.salvarConexao({
      urlBase: valores.urlBase.trim(), sessao: valores.sessao.trim(), chaveApi: valores.chaveApi.trim() || null,
      motor: valores.motor, versaoEsperada: this.conexao()?.versao ?? null
    }).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        this.formAvancado.controls.chaveApi.reset('');
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível validar e salvar o servidor.'); return; }
        this.aplicarConexao(resposta.dados);
        this.atualizarStatus();
        this.toast.sucesso('Servidor validado e salvo.');
      },
      error: erro => { this.formAvancado.controls.chaveApi.reset(''); this.toast.erroServidor(erro, 'Não foi possível validar e salvar o servidor.'); }
    });
  }

  private carregarAlbia(): void {
    this.service.obterAlbia().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) return;
        this.albia.set(resposta.dados);
        this.formPausa.reset({ minutos: resposta.dados.pausaHumanoMin });
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar a configuração da Albia.')
    });
  }

  private carregarBloqueados(): void {
    this.service.listarBloqueados().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => { if (resposta.sucesso && resposta.dados) this.bloqueados.set(resposta.dados); },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar a lista de números.')
    });
  }

  async alternarAlbia(ativa: boolean): Promise<void> {
    const atual = this.albia();
    if (!atual || !this.podeEditar() || this.processando()) return;
    if (!ativa) {
      const confirmado = await this.confirm.confirmar('Desligar a Albia?', 'Os clientes deixam de receber resposta automática. O WhatsApp continua conectado.', { textoConfirmar: 'Desligar a Albia' });
      if (!confirmado) return;
    }
    this.gravarAlbia(ativa, atual.pausaHumanoMin, ativa ? 'Albia ligada.' : 'Albia desligada.');
  }

  salvarPausa(): void {
    this.formPausa.markAllAsTouched();
    const atual = this.albia();
    if (!atual || !this.podeEditar() || this.processando() || this.formPausa.invalid) return;
    this.gravarAlbia(atual.ativa, this.formPausa.getRawValue().minutos, 'Pausa salva.');
  }

  private gravarAlbia(ativa: boolean, pausaHumanoMin: number, sucesso: string): void {
    const atual = this.albia();
    if (!atual) return;
    this.processando.set(true);
    this.service.salvarAlbia({ ativa, pausaHumanoMin, versaoEsperada: atual.versao })
      .pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
        next: resposta => {
          if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível salvar a configuração da Albia.'); return; }
          this.albia.set(resposta.dados);
          this.formPausa.reset({ minutos: resposta.dados.pausaHumanoMin });
          this.marcarSalvo();
          this.toast.sucesso(sucesso);
        },
        error: erro => { this.toast.erroServidor(erro, 'Não foi possível salvar a configuração da Albia.'); this.carregarAlbia(); }
      });
  }

  abrirBloqueado(): void {
    this.tipoIdentificador.set('telefone');
    this.formBloqueado.reset({ telefone: '', lid: '', nome: '', motivo: '' });
    this.modalBloqueado.set(true);
  }

  trocarTipoIdentificador(tipo: TipoIdentificador): void {
    this.tipoIdentificador.set(tipo);
  }

  salvarBloqueado(): void {
    this.formBloqueado.markAllAsTouched();
    if (!this.podeEditar() || this.processando() || this.formBloqueado.controls.nome.invalid || this.formBloqueado.controls.motivo.invalid) return;
    const valores = this.formBloqueado.getRawValue();
    const identificador = this.tipoIdentificador() === 'telefone' ? normalizarTelefoneBloqueio(valores.telefone) : valores.lid.trim();
    const valido = this.tipoIdentificador() === 'telefone' ? identificador.length >= 12 : PADRAO_LID.test(identificador);
    if (!valido) { this.toast.erro(this.tipoIdentificador() === 'telefone' ? 'Informe o telefone com DDD.' : 'Informe o identificador no formato 123456789@lid.'); return; }
    this.processando.set(true);
    this.service.adicionarBloqueado({ identificador, nome: valores.nome.trim(), motivo: valores.motivo.trim() || null })
      .pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
        next: resposta => {
          if (!resposta.sucesso) { this.toast.erro('Não foi possível adicionar o número.'); return; }
          this.modalBloqueado.set(false);
          this.carregarBloqueados();
          this.toast.sucesso('Número adicionado. A Albia não atenderá esta pessoa.');
        },
        error: erro => this.toast.erroServidor(erro, 'Não foi possível adicionar o número.')
      });
  }

  async removerBloqueado(contato: ContatoBloqueado): Promise<void> {
    if (!this.podeExcluir() || this.processando()) return;
    const confirmado = await this.confirm.confirmar(`Remover ${contato.nome}?`, 'A Albia volta a atender este número.', { textoConfirmar: 'Remover' });
    if (!confirmado || !this.podeExcluir() || this.processando()) return;
    this.processando.set(true);
    this.service.removerBloqueado(contato.id).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso) { this.toast.erro('Não foi possível remover o número.'); return; }
        this.carregarBloqueados();
        this.toast.sucesso('Número removido da lista.');
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível remover o número.')
    });
  }

  rotuloIdentificador(contato: ContatoBloqueado): string {
    return contato.identificador.endsWith('@lid') ? contato.identificador : formatarNumeroWaha(contato.identificador);
  }
}
