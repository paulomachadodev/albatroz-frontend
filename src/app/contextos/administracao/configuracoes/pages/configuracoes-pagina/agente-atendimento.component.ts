import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, takeUntil } from 'rxjs';
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
  AgenteConfig, ContatoBloqueado, ESPERA_RESPOSTA_MAXIMA_SEG, ESPERA_RESPOSTA_PADRAO_SEG, PAUSA_HUMANO_MAXIMA_MIN, PAUSA_HUMANO_PADRAO_MIN, descreverEspera, telefoneParaEdicao
} from '../../models/agente-atendimento.model';
import { formatarNumeroWaha, normalizarTelefoneBloqueio } from '../../models/waha.model';
import { AgenteAtendimentoService } from '../../services/agente-atendimento.service';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';

import { ABAS_AGENTE, AbaAgente } from '../../models/agente-secoes.model';
import { AgenteSecoesComponent } from './agente-secoes.component';

type TipoIdentificador = 'telefone' | 'lid';

const PADRAO_LID = /^\d{5,30}@lid$/i;

@Component({
  selector: 'app-agente-atendimento', standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, InputTextModule, BreadcrumbComponent, PageHeaderComponent, ModalComponent, ToggleComponent, BtnIconeComponent, CampoMascaraComponent, AgenteSecoesComponent],
  templateUrl: './agente-atendimento.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class AgenteAtendimentoComponent extends ConfiguracaoFormularioBase implements OnInit {
  private readonly service = inject(AgenteAtendimentoService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  protected override permissaoEdicao = 'atendimento:editar';

  readonly abas = ABAS_AGENTE;
  readonly aba = signal<AbaAgente>('geral');
  readonly secoesAbertas = signal(false);
  readonly carregando = signal(true);
  readonly processando = signal(false);
  readonly agente = signal<AgenteConfig | null>(null);
  readonly bloqueados = signal<ContatoBloqueado[]>([]);
  readonly modalBloqueado = signal(false);
  readonly emEdicao = signal<ContatoBloqueado | null>(null);
  readonly tipoIdentificador = signal<TipoIdentificador>('telefone');
  readonly podeExcluir = computed(() => this.contextoValido() && this.auth.temPermissao('atendimento:excluir'));
  readonly maximoEspera = ESPERA_RESPOSTA_MAXIMA_SEG;
  readonly maximoPausa = PAUSA_HUMANO_MAXIMA_MIN;

  readonly formTempos = this.fb.nonNullable.group({
    espera: [ESPERA_RESPOSTA_PADRAO_SEG, [Validators.required, Validators.min(0), Validators.max(ESPERA_RESPOSTA_MAXIMA_SEG)]],
    pausa: [PAUSA_HUMANO_PADRAO_MIN, [Validators.required, Validators.min(1), Validators.max(PAUSA_HUMANO_MAXIMA_MIN)]]
  });
  readonly formBloqueado = this.fb.nonNullable.group({
    telefone: [''],
    lid: [''],
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    motivo: ['', [Validators.maxLength(200)]]
  });

  readonly descricaoEspera = computed(() => descreverEspera(this.agente()?.esperaRespostaSeg ?? ESPERA_RESPOSTA_PADRAO_SEG));

  ngOnInit(): void {
    this.carregarConfiguracao();
    this.carregarBloqueados();
  }

  trocarAba(aba: AbaAgente): void {
    this.aba.set(aba);
    if (aba !== 'geral') this.secoesAbertas.set(true);
  }

  secoesPendentes(pendente: boolean): void {
    this.alterado.set(pendente);
  }

  private carregarConfiguracao(): void {
    this.service.obterConfiguracao().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível carregar o agente de atendimento.'); return; }
        this.aplicar(resposta.dados);
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar o agente de atendimento.')
    });
  }

  private aplicar(dados: AgenteConfig): void {
    this.agente.set(dados);
    this.formTempos.reset({ espera: dados.esperaRespostaSeg, pausa: dados.pausaHumanoMin });
    this.marcarSalvo();
  }

  private carregarBloqueados(): void {
    this.service.listarBloqueados().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => { if (resposta.sucesso && resposta.dados) this.bloqueados.set(resposta.dados); },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar a lista de números.')
    });
  }

  async alternarAtendimento(ativa: boolean): Promise<void> {
    const atual = this.agente();
    if (!atual || !this.podeEditar() || this.processando()) return;
    if (!ativa) {
      const confirmado = await this.confirm.confirmar('Desligar a Albia?', 'Os clientes deixam de receber resposta automática. O WhatsApp continua conectado.', { textoConfirmar: 'Desligar a Albia' });
      if (!confirmado) return;
    }
    this.gravar(ativa, atual.pausaHumanoMin, atual.esperaRespostaSeg, ativa ? 'Albia ligada.' : 'Albia desligada.');
  }

  salvarTempos(): void {
    this.formTempos.markAllAsTouched();
    const atual = this.agente();
    if (!atual || !this.podeEditar() || this.processando() || this.formTempos.invalid) return;
    const valores = this.formTempos.getRawValue();
    this.gravar(atual.ativa, valores.pausa, valores.espera, 'Tempos salvos.');
  }

  private gravar(ativa: boolean, pausaHumanoMin: number, esperaRespostaSeg: number, sucesso: string): void {
    const atual = this.agente();
    if (!atual) return;
    this.processando.set(true);
    this.service.salvarConfiguracao({ ativa, pausaHumanoMin, esperaRespostaSeg, versaoEsperada: atual.versao })
      .pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
        next: resposta => {
          if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível salvar a configuração.'); return; }
          this.aplicar(resposta.dados);
          this.toast.sucesso(sucesso);
        },
        error: erro => { this.toast.erroServidor(erro, 'Não foi possível salvar a configuração.'); this.carregarConfiguracao(); }
      });
  }

  abrirBloqueado(contato: ContatoBloqueado | null = null): void {
    if (!this.podeEditar()) return;
    const lid = contato?.identificador.endsWith('@lid') ?? false;
    this.emEdicao.set(contato);
    this.tipoIdentificador.set(lid ? 'lid' : 'telefone');
    this.formBloqueado.reset({
      telefone: contato && !lid ? telefoneParaEdicao(contato.identificador) : '',
      lid: contato && lid ? contato.identificador : '',
      nome: contato?.nome ?? '',
      motivo: contato?.motivo ?? ''
    });
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
    const contato = this.emEdicao();
    const requisicao = { identificador, nome: valores.nome.trim(), motivo: valores.motivo.trim() || null };
    const operacao = contato ? this.service.alterarBloqueado(contato.id, requisicao) : this.service.adicionarBloqueado(requisicao);
    const falha = contato ? 'Não foi possível salvar o número.' : 'Não foi possível adicionar o número.';
    operacao
      .pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
        next: resposta => {
          if (!resposta.sucesso) { this.toast.erro(falha); return; }
          this.modalBloqueado.set(false);
          this.carregarBloqueados();
          this.toast.sucesso(contato ? 'Número atualizado.' : 'Número adicionado. A Albia não atenderá esta pessoa.');
        },
        error: erro => this.toast.erroServidor(erro, falha)
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
