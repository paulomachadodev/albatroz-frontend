import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { PT_MULTISELECT } from '../../../../shared/utils/pt-multiselect';
import { AjudaCampoComponent } from '../../../../shared/components/ajuda-campo/ajuda-campo.component';
import { MarketingGuiaComponent } from '../../components/marketing-guia.component';
import { PerfisSociaisService } from '../../../administracao/configuracoes/services/perfis-sociais.service';
import { FORMATOS_EDITORIAIS, FORMATOS_POR_REDE, PERFIL_SELECT_PT } from '../../../administracao/configuracoes/models/perfil-social.model';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { Briefing, BriefingEdicao, STATUS_BRIEFING } from '../../models/marketing.model';
import { MarketingService } from '../../services/marketing.service';
import { SelectBuscaMultiComponent } from '../../../../shared/components/select-busca-multi/select-busca-multi.component';
import { OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-briefings-lista',
  standalone: true,
  imports: [SelectModule, MultiSelectModule, SelectBuscaMultiComponent, AjudaCampoComponent, MarketingGuiaComponent, RouterLink, FormsModule, DatePipe, ListagemPaginadaComponent, DrawerComponent, PageHeaderComponent, ThOrdenavelComponent, BreadcrumbComponent],
  templateUrl: './briefings-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class BriefingsListaComponent implements OnInit {
  readonly selectPt = PERFIL_SELECT_PT;
  private readonly service = inject(MarketingService);
  private readonly perfisService = inject(PerfisSociaisService);
  readonly perfisHabilitados = signal(false);
  readonly redesCadastradas = signal<string[]>([]);
  readonly formatosDisponiveis = FORMATOS_EDITORIAIS;
  redeOriginal = ''; formatoOriginal = ''; linhaOriginal = '';
  podeGerenciarPerfis() { return this.auth.temPermissao('integracoes_sociais:ler'); }
  readonly multiselectPt = PT_MULTISELECT;
  redesEscolhidas: string[] = [];
  redesOpcoes() {
    const valores = this.perfisHabilitados() ? this.redesCadastradas() : this.redesSugeridas();
    const fora = this.redesEscolhidas.filter(r => !valores.includes(r));
    return [...valores, ...fora].map(valor => ({ rotulo: valor, valor }));
  }
  formatosComuns(): string[] {
    if (this.redesEscolhidas.length === 0) return this.formatosDisponiveis;
    return this.formatosDisponiveis.filter(f => this.redesEscolhidas.every(r => (FORMATOS_POR_REDE[r] ?? this.formatosDisponiveis).includes(f)));
  }
  formatosOpcoes() { return this.opcoes(this.formatosComuns(), this.formatoOriginal); }
  aoMudarRedes(valores: string[]) {
    this.redesEscolhidas = valores;
    this.rede = valores.join(',');
    if (this.formato && !this.formatosComuns().includes(this.formato)) this.formato = '';
  }
  linhasOpcoes() { return this.opcoes(this.linhasSugeridas(), this.linhaOriginal); }
  private opcoes(valores: string[], original: string) { return [...valores.map(valor => ({ rotulo: valor, valor, desabilitada: false })), ...(original && !valores.includes(original) ? [{ rotulo: original + ' (fora da lista ativa)', valor: original, desabilitada: true }] : [])]; }

  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly usuarioInicial = this.auth.usuario()?.id;
  private readonly empresaInicial = this.auth.empresaIdAtual();
  private readonly contextoEncerrado = new Subject<void>();
  private consulta?: Subscription;
  private escrita?: Subscription;
  readonly contextoValido = computed(() => this.auth.usuario()?.id === this.usuarioInicial && this.auth.empresaIdAtual() === this.empresaInicial && this.auth.temPermissao('marketing:ler'));


  readonly statusOpcoes = STATUS_BRIEFING;

  carregando = signal(true);
  itens = signal<Briefing[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtroTexto = '';
  filtroRede = '';
  filtroStatus = '';

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  briefingEmEdicao = signal<Briefing | null>(null);
  salvando = signal(false);
  linhasSugeridas = signal<string[]>([]);
  redesSugeridas = signal<string[]>([]);

  objetivo = '';
  publico = '';
  linha = '';
  assunto = '';
  produtoServico = '';
  produtosSelecionados: OpcaoSelectBusca[] = [];
  buscarProdutos = this.service.buscarProdutos;
  oferta = '';
  formato = '';
  rede = '';
  referencias = '';
  prazo = '';
  status = 1;

  constructor() {
    effect(() => {
      if (!this.contextoValido()) {
        this.contextoEncerrado.next();
        this.consulta?.unsubscribe(); this.escrita?.unsubscribe();
        this.itens.set([]); this.drawerAberto.set(false); this.briefingEmEdicao.set(null);
        this.linhasSugeridas.set([]); this.redesSugeridas.set([]); this.redesCadastradas.set([]);
        this.objetivo = ''; this.publico = ''; this.linha = ''; this.assunto = ''; this.produtoServico = ''; this.produtosSelecionados = []; this.oferta = ''; this.formato = ''; this.rede = ''; this.redesEscolhidas = []; this.referencias = ''; this.prazo = '';
        this.carregando.set(false); this.salvando.set(false);
        queueMicrotask(() => { if (!this.destroyRef.destroyed) void this.router.navigate(['/dashboard'], { replaceUrl: true }); });
      }
      if ((this.modoDrawer() === 'criar' && !this.podeCriar()) || (this.modoDrawer() === 'editar' && !this.podeEditar())) {
        this.escrita?.unsubscribe(); this.salvando.set(false);
      }
    });
  }

  ngOnInit() {
    this.carregar();
    this.carregarSugestoes();
    this.perfisService.filtros().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({ next: res => { if (!this.contextoValido()) return; this.perfisHabilitados.set(res.dados?.redesSociaisHabilitado === true); this.redesCadastradas.set(res.dados?.redes ?? []); }, error: () => undefined });
  }

  podeCriar(): boolean {
    return this.contextoValido() && this.auth.temPermissao('marketing:criar');
  }

  podeEditar(): boolean {
    return this.contextoValido() && this.auth.temPermissao('marketing:editar');
  }

  podeExcluir(): boolean {
    return this.contextoValido() && this.auth.temPermissao('marketing:excluir');
  }

  async excluir(): Promise<void> {
    const emEdicao = this.briefingEmEdicao();
    if (!emEdicao || !this.podeExcluir() || this.salvando()) return;
    const confirmado = await this.confirm.confirmar('Excluir este briefing?', 'O briefing e as peças e artes feitas a partir dele serão apagados de vez. Só é possível enquanto nada tiver sido publicado ou agendado.', { textoConfirmar: 'Excluir', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    this.salvando.set(true);
    this.service.excluirBriefing(emEdicao.id).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.salvando.set(false);
        if (!res.sucesso) { this.toast.erro('Não foi possível excluir o briefing.'); return; }
        this.toast.sucesso('Briefing excluído.');
        this.drawerAberto.set(false);
        this.carregar(this.paginaAtual());
      },
      error: erro => { this.salvando.set(false); this.toast.erroServidor(erro, 'Não foi possível excluir o briefing.'); }
    });
  }

  rotuloStatus(valor: number): string {
    return this.statusOpcoes.find(s => s.valor === valor)?.rotulo ?? '-';
  }

  classeStatus(valor: number): string {
    if (valor === 2) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (valor === 3) return 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  }

  carregar(pagina = 1) {
    if (!this.contextoValido()) return;
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.consulta = this.service.listarBriefings(pagina, this.tamanhoPagina(), {
      texto: this.filtroTexto.trim() || undefined,
      rede: this.filtroRede.trim() || undefined,
      status: this.filtroStatus === '' ? undefined : Number(this.filtroStatus),
      ordenarPor: this.ordenacaoAtual()?.campo,
      direcao: this.ordenacaoAtual()?.direcao
    }).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os briefings.');
        this.carregando.set(false);
      }
    });
  }

  private carregarSugestoes() {
    this.service.obterEstrategia().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const estrategia = res.dados;
        if (!estrategia?.habilitado) return;
        this.linhasSugeridas.set(estrategia.linhas.filter(l => l.ativa).map(l => l.nome));
        this.redesSugeridas.set(estrategia.redes);
      },
      error: () => undefined
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtroTexto = '';
    this.filtroRede = '';
    this.filtroStatus = '';
    this.ordenacaoAtual.set(null);
    this.carregar(1);
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  abrirCriar() {
    if (!this.podeCriar()) return;
    this.modoDrawer.set('criar');
    this.briefingEmEdicao.set(null);
    this.preencher({ objetivo: '', publico: '', linha: '', assunto: '', produtoServico: '', oferta: '', formato: '', rede: '', referencias: '', prazo: null }, 1);
    this.produtosSelecionados = [];
    this.drawerAberto.set(true);
  }

  abrirEditar(briefing: Briefing) {
    if (!this.contextoValido()) return;
    this.modoDrawer.set('editar');
    this.briefingEmEdicao.set(briefing);
    this.preencher(briefing, briefing.status);
    this.produtosSelecionados = (briefing.produtos ?? []).map(p => ({ id: p.id, nome: `${p.nome} (${p.codigo})`, imagem: p.imagem ?? null }));
    this.drawerAberto.set(true);
  }

  cancelar() {
    this.drawerAberto.set(false);
  }

  somenteLeitura(): boolean {
    const emEdicao = this.briefingEmEdicao();
    return this.modoDrawer() === 'editar' && (!this.podeEditar() || emEdicao?.status === 3);
  }

  salvar() {
    if (!this.contextoValido() || this.salvando() || this.somenteLeitura() || (this.modoDrawer() === 'criar' ? !this.podeCriar() : !this.podeEditar())) return;
    const dados = this.montar();
    if (!dados.objetivo || !dados.assunto || !dados.formato || !dados.rede) {
      this.toast.erro('Informe objetivo, assunto, formato e rede.');
      return;
    }
    this.salvando.set(true);
    const emEdicao = this.briefingEmEdicao();
    const chamada = this.modoDrawer() === 'criar' || !emEdicao
      ? this.service.criarBriefing(dados)
      : this.service.atualizarBriefing(emEdicao.id, { ...dados, status: this.status, versaoEsperada: emEdicao.versao });
    this.escrita = chamada.pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso(emEdicao ? 'Briefing atualizado.' : 'Briefing criado.');
        this.drawerAberto.set(false);
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar o briefing.');
      }
    });
  }

  private montar(): BriefingEdicao & { produtoIds: number[] } {
    return {
      produtoIds: this.produtosSelecionados.map(p => Number(p.id)),
      objetivo: this.objetivo.trim(),
      publico: this.publico.trim(),
      linha: this.linha.trim(),
      assunto: this.assunto.trim(),
      produtoServico: this.produtoServico.trim(),
      oferta: this.oferta.trim(),
      formato: this.formato.trim(),
      rede: this.rede.trim(),
      referencias: this.referencias.trim(),
      prazo: this.prazo || null
    };
  }

  private preencher(dados: BriefingEdicao, status: number) {
    this.redesEscolhidas = dados.rede ? dados.rede.split(',').map(r => r.trim()).filter(Boolean) : [];
    this.formatoOriginal = dados.formato; this.linhaOriginal = dados.linha;
    this.objetivo = dados.objetivo;
    this.publico = dados.publico;
    this.linha = dados.linha;
    this.assunto = dados.assunto;
    this.produtoServico = dados.produtoServico;
    this.oferta = dados.oferta;
    this.formato = dados.formato;
    this.rede = dados.rede;
    this.referencias = dados.referencias;
    this.prazo = dados.prazo ?? '';
    this.status = status;
  }
}
