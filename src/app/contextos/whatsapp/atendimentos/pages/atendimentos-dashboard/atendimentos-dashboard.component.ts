import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AtendimentosWhatsappService, AtendimentoWhatsappFiltro } from '../../services/atendimentos-whatsapp.service';
import {
  AtendimentoWhatsappResumo,
  AtendimentoWhatsappMensal,
  AtendimentoWhatsappDiario,
  AtendimentoWhatsappMensagem,
  AtendimentoWhatsappStatus
} from '../../models/atendimento-whatsapp.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ContatosService } from '../../../../contatos/services/contatos.service';
import { ContatoBusca } from '../../../../contatos/models/contato-busca.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../../shared/components/spinner/spinner.component';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { ThOrdenavelComponent, Ordenacao } from '../../../../../shared/components/th-ordenavel/th-ordenavel.component';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const STATUS_CLASSES: Record<AtendimentoWhatsappStatus, string> = {
  'Ativo': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'Aguardando': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'Com atendente': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  'Encerrado': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
};

const REMETENTE_ROTULO_CLASSES: Record<string, string> = {
  'Cliente': 'bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  'Albia': 'bg-amber-200 text-amber-800 dark:bg-amber-800/60 dark:text-amber-200',
  'Atendente': 'bg-blue-200 text-blue-800 dark:bg-blue-800/60 dark:text-blue-200',
  'Sistema': 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
};

const REMETENTE_BOLHA_CLASSES: Record<string, string> = {
  'Cliente': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  'Albia': 'bg-amber-50 text-slate-800 dark:bg-amber-900/30 dark:text-amber-50',
  'Atendente': 'bg-blue-50 text-slate-800 dark:bg-blue-900/30 dark:text-blue-50',
  'Sistema': 'bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400'
};

@Component({
  selector: 'app-atendimentos-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ModalComponent,
    PageHeaderComponent,
    SpinnerComponent,
    ListagemPaginadaComponent,
    DrawerComponent,
    ThOrdenavelComponent
  ],
  templateUrl: './atendimentos-dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class AtendimentosDashboardComponent implements OnInit {
  carregando = signal(true);
  itens = signal<AtendimentoWhatsappResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);

  mensal = signal<AtendimentoWhatsappMensal[]>([]);
  processandoVinculo = signal(false);
  vinculandoWhatsappId = signal<string | null>(null);
  contatoSelecionado = signal<ContatoBusca | null>(null);
  termoContato = '';
  resultadosContato = signal<ContatoBusca[]>([]);
  buscandoContato = signal(false);
  private debounceContato?: ReturnType<typeof setTimeout>;

  anoAtual = new Date().getFullYear();
  mesAtual = new Date().getMonth() + 1;
  filtro: AtendimentoWhatsappFiltro = { ano: this.anoAtual };

  ordenacaoAtual = signal<Ordenacao | null>(null);

  // Gráfico diário
  diario = signal<AtendimentoWhatsappDiario[]>([]);
  anoDiario = this.anoAtual;
  mesDiario = this.mesAtual;

  // Drawer de histórico de mensagens
  historicoAberto = signal(false);
  atendimentoIdHistorico = signal<number | null>(null);
  protocoloHistorico = signal<string | null>(null);
  nomeContatoHistorico = signal<string | null>(null);
  mensagens = signal<AtendimentoWhatsappMensagem[]>([]);
  carregandoMensagens = signal(false);
  termoBuscaMensagem = signal('');

  @ViewChild('fimMensagens') fimMensagens?: ElementRef<HTMLDivElement>;

  maxMensal = computed(() => Math.max(1, ...this.mensal().map(m => m.totalAtendimentos)));
  maxDiario = computed(() => Math.max(1, ...this.diario().map(d => d.totalAtendimentos)));

  mensagensFiltradas = computed(() => {
    const termo = this.termoBuscaMensagem().trim().toLowerCase();
    if (!termo) return this.mensagens();
    return this.mensagens().filter(m => (m.mensagem ?? '').toLowerCase().includes(termo));
  });

  tituloHistorico = computed(() => {
    const protocolo = this.protocoloHistorico();
    const nome = this.nomeContatoHistorico();
    if (!protocolo) return '';
    return nome ? `Atendimento ${protocolo} — ${nome}` : `Atendimento ${protocolo}`;
  });

  constructor(
    private atendimentosService: AtendimentosWhatsappService,
    private contatosService: ContatosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregarMensal();
    this.carregarDiario();
    this.carregar();
  }

  carregarMensal() {
    this.atendimentosService.porMes(this.filtro.ano ?? this.anoAtual).subscribe({
      next: res => this.mensal.set(res.dados ?? [])
    });
  }

  carregarDiario() {
    this.atendimentosService.porDia(this.anoDiario, this.mesDiario).subscribe({
      next: res => this.diario.set(res.dados ?? [])
    });
  }

  aoClicarMesMensal(m: AtendimentoWhatsappMensal) {
    this.anoDiario = m.ano;
    this.mesDiario = m.mes;
    this.carregarDiario();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.atendimentosService.listar({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os atendimentos.');
        this.carregando.set(false);
      }
    });
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.filtro.ordenarPor = ordenacao.campo;
    this.filtro.direcao = ordenacao.direcao;
    this.carregar(1);
  }

  aplicarFiltros() {
    this.carregarMensal();
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = { ano: this.anoAtual };
    this.ordenacaoAtual.set(null);
    this.carregarMensal();
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  processarVinculoAutomatico() {
    this.processandoVinculo.set(true);
    this.atendimentosService.processarVinculoAutomatico().subscribe({
      next: res => {
        this.toast.sucesso(`${res.dados?.vinculados ?? 0} contato(s) vinculado(s) automaticamente.`);
        this.processandoVinculo.set(false);
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível processar o vínculo automático.');
        this.processandoVinculo.set(false);
      }
    });
  }

  abrirVinculoManual(item: AtendimentoWhatsappResumo, event?: Event) {
    event?.stopPropagation();
    this.vinculandoWhatsappId.set(item.whatsappId);
    this.contatoSelecionado.set(
      item.idContato && item.nomeContato ? { id: item.idContato, nome: item.nomeContato } : null
    );
    this.termoContato = '';
    this.resultadosContato.set([]);
  }

  fecharVinculoManual() {
    this.vinculandoWhatsappId.set(null);
    this.contatoSelecionado.set(null);
  }

  aoDigitarContato(valor: string) {
    this.termoContato = valor;
    this.contatoSelecionado.set(null);
    if (this.debounceContato) clearTimeout(this.debounceContato);
    if (valor.trim().length < 2) { this.resultadosContato.set([]); return; }

    this.debounceContato = setTimeout(() => {
      this.buscandoContato.set(true);
      this.contatosService.buscar(valor.trim()).subscribe({
        next: res => {
          this.resultadosContato.set(res.dados ?? []);
          this.buscandoContato.set(false);
        },
        error: () => this.buscandoContato.set(false)
      });
    }, 300);
  }

  selecionarContato(contato: ContatoBusca) {
    this.contatoSelecionado.set(contato);
    this.termoContato = contato.nome;
    this.resultadosContato.set([]);
  }

  confirmarVinculoManual() {
    const whatsappId = this.vinculandoWhatsappId();
    const contato = this.contatoSelecionado();
    if (!whatsappId || !contato) return;

    this.atendimentosService.vincular(whatsappId, contato.id).subscribe({
      next: () => {
        this.toast.sucesso('Vínculo salvo.');
        this.fecharVinculoManual();
        this.carregar(this.paginaAtual());
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível vincular.')
    });
  }

  abrirHistorico(item: AtendimentoWhatsappResumo) {
    this.atendimentoIdHistorico.set(item.id);
    this.protocoloHistorico.set(item.protocolo);
    this.nomeContatoHistorico.set(item.nomeContato || item.nomeWhatsapp || null);
    this.mensagens.set([]);
    this.termoBuscaMensagem.set('');
    this.historicoAberto.set(true);
    this.carregandoMensagens.set(true);

    this.atendimentosService.mensagens(item.id).subscribe({
      next: res => {
        this.mensagens.set(res.dados ?? []);
        this.carregandoMensagens.set(false);
        this.rolarParaFim();
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o histórico.');
        this.carregandoMensagens.set(false);
      }
    });
  }

  private rolarParaFim() {
    setTimeout(() => {
      this.fimMensagens?.nativeElement.scrollIntoView({ block: 'end' });
    });
  }

  fecharHistorico() {
    this.historicoAberto.set(false);
    this.atendimentoIdHistorico.set(null);
    this.protocoloHistorico.set(null);
    this.nomeContatoHistorico.set(null);
    this.mensagens.set([]);
    this.termoBuscaMensagem.set('');
  }

  labelMes(mes: number): string {
    return MESES[mes - 1] ?? String(mes);
  }

  barraAltura(total: number): string {
    return `${Math.max(4, (total / this.maxMensal()) * 100)}%`;
  }

  barraAlturaDia(total: number): string {
    return `${Math.max(4, (total / this.maxDiario()) * 100)}%`;
  }

  classeStatus(status: AtendimentoWhatsappStatus): string {
    return STATUS_CLASSES[status] ?? STATUS_CLASSES['Encerrado'];
  }

  classeRotuloRemetente(quem: string): string {
    return REMETENTE_ROTULO_CLASSES[quem] ?? REMETENTE_ROTULO_CLASSES['Cliente'];
  }

  classeBolhaRemetente(quem: string): string {
    return REMETENTE_BOLHA_CLASSES[quem] ?? REMETENTE_BOLHA_CLASSES['Cliente'];
  }

  alinhamentoRemetente(quem: string): 'esquerda' | 'direita' | 'centro' {
    if (quem === 'Cliente') return 'esquerda';
    if (quem === 'Sistema') return 'centro';
    return 'direita';
  }
}
