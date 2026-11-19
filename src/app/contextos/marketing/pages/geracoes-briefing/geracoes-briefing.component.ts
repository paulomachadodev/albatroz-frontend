import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, exhaustMap, forkJoin, of, timer } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService, ConfirmState } from '../../../../core/feedback/confirm.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { Briefing } from '../../models/marketing.model';
import { GeracaoMarketing } from '../../models/geracao-marketing.model';
import { GeracoesMarketingService } from '../../services/geracoes-marketing.service';
import { PecasService } from '../../services/pecas.service';
import { BtnIconeComponent } from '../../../../shared/components/btn-icone/btn-icone.component';

@Component({
  selector: 'app-geracoes-briefing', standalone: true,
  imports: [BtnIconeComponent, DatePipe, BreadcrumbComponent, PageHeaderComponent, ListagemPaginadaComponent],
  templateUrl: './geracoes-briefing.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class GeracoesBriefingComponent {
  private readonly service = inject(GeracoesMarketingService);
  private readonly pecas = inject(PecasService);
  readonly criandoPeca = signal(false);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly rota = inject(ActivatedRoute);
  private readonly usuarioInicial = this.auth.usuario()?.id;
  private readonly empresaInicial = this.auth.empresaIdAtual();
  private ciclo = 0;
  private acaoId = 0;
  private tipoAcao: 'criar' | 'cancelar' | null = null;
  private consulta?: Subscription;
  private detalhe?: Subscription;
  private polling?: Subscription;
  private acao?: Subscription;
  private chavePendente: string | null = null;
  private confirmacaoAtiva: ConfirmState | null = null;
  briefingId = Number(this.rota.snapshot.paramMap.get('id'));
  readonly contextoValido = computed(() => this.auth.usuario()?.id === this.usuarioInicial && this.auth.empresaIdAtual() === this.empresaInicial && this.auth.temPermissao('marketing:ler'));
  readonly podeCriar = computed(() => this.contextoValido() && this.auth.temPermissao('marketing:criar'));
  readonly podeEditar = computed(() => this.contextoValido() && this.auth.temPermissao('marketing:editar'));
  readonly briefing = signal<Briefing | null>(null);
  readonly habilitado = signal(false);
  readonly carregando = signal(true);
  readonly processando = signal(false);
  readonly retomavel = signal(false);
  readonly itens = signal<GeracaoMarketing[]>([]);
  readonly selecionada = signal<GeracaoMarketing | null>(null);
  readonly podeGerar = computed(() => this.podeCriar() && this.habilitado() && (this.briefing()?.status === 2 || this.retomavel()) && !this.processando() && !this.carregando());

  constructor() {
    this.destroyRef.onDestroy(() => this.limpar());
    effect(() => {
      if (!this.contextoValido()) {
        this.limpar();
        queueMicrotask(() => { if (!this.destroyRef.destroyed) void this.router.navigate(['/marketing/briefings'], { replaceUrl: true }); });
      }
    });
    effect(() => {
      const criar = this.podeCriar();
      const editar = this.podeEditar();
      if ((this.tipoAcao === 'criar' && !criar) || (this.tipoAcao === 'cancelar' && !editar)) {
        this.acaoId++;
        this.encerrarConfirmacao();
        this.acao?.unsubscribe();
        this.processando.set(false);
      }
      if (!criar) { this.chavePendente = null; this.retomavel.set(false); }
    });
    this.rota.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(parametros => {
      const id = Number(parametros.get('id'));
      if (id !== this.briefingId) { this.limpar(); this.briefingId = id; this.carregar(); }
    });
    this.carregar();
  }

  carregar(): void {
    if (!this.contextoValido() || this.processando()) return;
    if (!Number.isSafeInteger(this.briefingId) || this.briefingId <= 0) { this.carregando.set(false); this.toast.erro('Briefing inválido.'); return; }
    const ciclo = ++this.ciclo;
    this.consulta?.unsubscribe(); this.polling?.unsubscribe(); this.detalhe?.unsubscribe();
    this.carregando.set(true);
    this.consulta = forkJoin({ briefing: this.service.obterBriefing(this.briefingId), geracoes: this.service.listar(this.briefingId) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!this.valido(ciclo)) return;
        this.carregando.set(false);
        if (!resposta.briefing.sucesso || !resposta.briefing.dados || !resposta.geracoes.sucesso || !resposta.geracoes.dados) { this.toast.erro('Não foi possível consultar as gerações.'); return; }
        this.briefing.set(resposta.briefing.dados);
        this.habilitado.set(resposta.geracoes.dados.habilitado);
        this.itens.set(resposta.geracoes.dados.itens);
        if (!this.habilitado()) { this.selecionada.set(null); return; }
        const atual = this.selecionada();
        this.selecionada.set(resposta.geracoes.dados.itens.find(item => item.id === atual?.id) ?? resposta.geracoes.dados.itens[0] ?? null);
        this.iniciarPolling();
      },
      error: erro => { if (this.valido(ciclo)) { this.carregando.set(false); this.toast.erroServidor(erro, 'Não foi possível consultar as gerações.'); } }
    });
  }

  async gerar(): Promise<void> {
    if (!this.podeGerar()) return;
    const ciclo = this.ciclo;
    const id = ++this.acaoId;
    const retomada = this.chavePendente !== null;
    this.tipoAcao = 'criar';
    this.processando.set(true);
    const promessa = this.confirm.confirmar(retomada ? 'Retomar a mesma solicitação?' : 'Gerar rascunho com IA?', retomada ? 'Reutilizaremos o mesmo pedido para evitar duplicação. Se ele ainda não foi registrado, será criado e poderá gerar cobrança.' : 'A geração usa a chave Google da empresa atual e pode gerar cobrança na sua conta. Exige política de limites ativa. O texto será um rascunho para revisão humana.', { textoConfirmar: retomada ? 'Retomar solicitação' : 'Gerar rascunho' });
    const estadoConfirmacao = this.confirm.estado(); this.confirmacaoAtiva = estadoConfirmacao;
    const confirmado = await promessa;
    if (this.confirmacaoAtiva === estadoConfirmacao) this.confirmacaoAtiva = null;
    if (!this.valido(ciclo) || id !== this.acaoId || !this.podeCriar()) return;
    if (!confirmado) { this.processando.set(false); return; }
    if (!this.habilitado() || (this.briefing()?.status !== 2 && !retomada)) { this.processando.set(false); return; }
    const chave = this.chavePendente ?? this.novaChave();
    this.chavePendente = chave;
    this.retomavel.set(true);
    this.acao = this.service.gerar(this.briefingId, chave).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!this.valido(ciclo) || id !== this.acaoId || !this.podeCriar()) return;
        this.processando.set(false);
        if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível confirmar a solicitação. Retome a mesma solicitação antes de iniciar outra.'); return; }
        this.chavePendente = null; this.retomavel.set(false);
        this.receber(resposta.dados); this.selecionada.set(resposta.dados);
        this.iniciarPolling();
      },
      error: erro => { if (this.valido(ciclo) && id === this.acaoId && this.podeCriar()) { this.processando.set(false); this.toast.erroServidor(erro, 'Não foi possível confirmar a solicitação. Retome a mesma solicitação antes de iniciar outra.'); } }
    });
  }

  selecionar(item: GeracaoMarketing): void {
    if (!this.contextoValido()) return;
    this.selecionada.set(item);
    this.detalhe?.unsubscribe();
    const ciclo = this.ciclo;
    this.detalhe = this.service.obter(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => { if (this.valido(ciclo) && resposta.sucesso && resposta.dados) this.receber(resposta.dados); },
      error: erro => { if (this.valido(ciclo)) this.toast.erroServidor(erro, 'Não foi possível atualizar o rascunho.'); }
    });
    this.iniciarPolling();
  }

  criarPeca(geracao: GeracaoMarketing): void {
    if (!this.podeCriar() || geracao.status !== 3 || !geracao.resultado || this.criandoPeca()) return;
    this.criandoPeca.set(true);
    this.pecas.criar(geracao.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.criandoPeca.set(false);
        if (res.sucesso && res.dados) void this.router.navigate(['/marketing/pecas', res.dados.id]);
        else this.toast.erro('Não foi possível criar a peça.');
      },
      error: erro => { this.criandoPeca.set(false); this.toast.erroServidor(erro, 'Não foi possível criar a peça.'); }
    });
  }

  async cancelar(): Promise<void> {
    const geracao = this.selecionada();
    if (!this.podeEditar() || !geracao || geracao.status !== 1 || this.processando()) return;
    const ciclo = this.ciclo; const id = ++this.acaoId;
    this.tipoAcao = 'cancelar';
    this.processando.set(true);
    const promessa = this.confirm.confirmar('Cancelar geração pendente?', 'O cancelamento só é garantido antes de a chamada ao Google começar.', { textoConfirmar: 'Cancelar geração' });
    const estadoConfirmacao = this.confirm.estado(); this.confirmacaoAtiva = estadoConfirmacao;
    const confirmado = await promessa;
    if (this.confirmacaoAtiva === estadoConfirmacao) this.confirmacaoAtiva = null;
    if (!this.valido(ciclo) || id !== this.acaoId || !this.podeEditar()) return;
    if (!confirmado) { this.processando.set(false); return; }
    this.acao = this.service.cancelar(geracao.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => { if (this.valido(ciclo) && id === this.acaoId && this.podeEditar()) { this.processando.set(false); if (resposta.sucesso && resposta.dados) { this.receber(resposta.dados); this.iniciarPolling(); } else this.toast.erro('Não foi possível confirmar o cancelamento. Atualize a consulta.'); } },
      error: erro => { if (this.valido(ciclo) && id === this.acaoId && this.podeEditar()) { this.processando.set(false); this.toast.erroServidor(erro, 'Não foi possível cancelar. A execução pode já ter iniciado.'); } }
    });
  }

  status(valor: number): string {
    return ({ 1: 'Pendente', 2: 'Executando', 3: 'Concluída', 4: 'Falha', 5: 'Cancelada', 6: 'Indeterminada' } as Record<number, string>)[valor] ?? 'Desconhecida';
  }

  private receber(item: GeracaoMarketing): void {
    const anterior = this.itens().find(atual => atual.id === item.id);
    if (anterior && Date.parse(anterior.atualizadoEmUtc) > Date.parse(item.atualizadoEmUtc)) return;
    this.itens.update(itens => [item, ...itens.filter(atual => atual.id !== item.id)].sort((a, b) => b.criadoEmUtc.localeCompare(a.criadoEmUtc)).slice(0, 20));
    if (this.selecionada()?.id === item.id) this.selecionada.set(item);
  }

  private iniciarPolling(): void {
    this.polling?.unsubscribe();
    if (!this.habilitado() || !this.contextoValido() || !this.itens().some(item => item.status === 1 || item.status === 2)) return;
    const ciclo = this.ciclo;
    this.polling = timer(3000, 3000).pipe(exhaustMap(() => forkJoin({ lista: this.service.listar(this.briefingId), detalhe: this.selecionada() ? this.service.obter(this.selecionada()!.id) : of(null) })), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!this.valido(ciclo)) return;
        if (!resposta.lista.sucesso || !resposta.lista.dados) { this.polling?.unsubscribe(); this.toast.erro('Atualização interrompida. Atualize a consulta.'); return; }
        this.habilitado.set(resposta.lista.dados.habilitado);
        if (!this.habilitado()) { this.itens.set([]); this.selecionada.set(null); this.polling?.unsubscribe(); return; }
        for (const item of resposta.lista.dados.itens) this.receber(item);
        if (resposta.detalhe?.sucesso && resposta.detalhe.dados) this.receber(resposta.detalhe.dados);
        if (!this.itens().some(item => item.status === 1 || item.status === 2)) this.polling?.unsubscribe();
      },
      error: erro => { if (this.valido(ciclo)) { this.polling?.unsubscribe(); this.toast.erroServidor(erro, 'Atualização interrompida. Atualize a consulta.'); } }
    });
  }

  private valido(ciclo: number): boolean {
    return ciclo === this.ciclo && !this.destroyRef.destroyed && this.contextoValido();
  }

  private novaChave(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const partes = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
    return partes.slice(0, 4).join('') + '-' + partes.slice(4, 6).join('') + '-' + partes.slice(6, 8).join('') + '-' + partes.slice(8, 10).join('') + '-' + partes.slice(10).join('');
  }

  private encerrarConfirmacao(): void {
    if (this.confirmacaoAtiva && this.confirm.estado() === this.confirmacaoAtiva) this.confirm.responder(false);
    this.confirmacaoAtiva = null;
  }

  private limpar(): void {
    this.encerrarConfirmacao();
    this.ciclo++; this.acaoId++;
    this.consulta?.unsubscribe(); this.detalhe?.unsubscribe(); this.polling?.unsubscribe(); this.acao?.unsubscribe();
    this.itens.set([]); this.selecionada.set(null); this.briefing.set(null); this.habilitado.set(false);
    this.chavePendente = null; this.retomavel.set(false); this.processando.set(false); this.carregando.set(false);
  }
}
