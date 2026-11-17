import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { Briefing, BriefingEdicao, STATUS_BRIEFING } from '../../models/marketing.model';
import { MarketingService } from '../../services/marketing.service';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-briefings-lista',
  standalone: true,
  imports: [FormsModule, DatePipe, ListagemPaginadaComponent, DrawerComponent, PageHeaderComponent, ThOrdenavelComponent, BreadcrumbComponent],
  templateUrl: './briefings-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class BriefingsListaComponent implements OnInit {
  private readonly service = inject(MarketingService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

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
  oferta = '';
  formato = '';
  rede = '';
  referencias = '';
  prazo = '';
  status = 1;

  ngOnInit() {
    this.carregar();
    this.carregarSugestoes();
  }

  podeCriar(): boolean {
    return this.auth.temPermissao('marketing:criar');
  }

  podeEditar(): boolean {
    return this.auth.temPermissao('marketing:editar');
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
    this.carregando.set(true);
    this.service.listarBriefings(pagina, this.tamanhoPagina(), {
      texto: this.filtroTexto.trim() || undefined,
      rede: this.filtroRede.trim() || undefined,
      status: this.filtroStatus === '' ? undefined : Number(this.filtroStatus),
      ordenarPor: this.ordenacaoAtual()?.campo,
      direcao: this.ordenacaoAtual()?.direcao
    }).subscribe({
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
    this.service.obterEstrategia().subscribe({
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
    this.modoDrawer.set('criar');
    this.briefingEmEdicao.set(null);
    this.preencher({ objetivo: '', publico: '', linha: '', assunto: '', produtoServico: '', oferta: '', formato: '', rede: '', referencias: '', prazo: null }, 1);
    this.drawerAberto.set(true);
  }

  abrirEditar(briefing: Briefing) {
    this.modoDrawer.set('editar');
    this.briefingEmEdicao.set(briefing);
    this.preencher(briefing, briefing.status);
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
    chamada.subscribe({
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

  private montar(): BriefingEdicao {
    return {
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
