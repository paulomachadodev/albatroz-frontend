import { Component, OnInit, signal, computed } from '@angular/core';
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

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const STATUS_CLASSES: Record<AtendimentoWhatsappStatus, string> = {
  'Ativo': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'Aguardando': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'Com atendente': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  'Encerrado': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
};

const REMETENTE_CLASSES: Record<string, string> = {
  'Cliente': 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  'Albia': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Atendente Humano': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
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
    DrawerComponent
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

  // Gráfico diário
  diario = signal<AtendimentoWhatsappDiario[]>([]);
  anoDiario = this.anoAtual;
  mesDiario = this.mesAtual;

  // Drawer de histórico de mensagens
  historicoAberto = signal(false);
  whatsappIdHistorico = signal<string | null>(null);
  nomeContatoHistorico = signal<string | null>(null);
  mensagens = signal<AtendimentoWhatsappMensagem[]>([]);
  carregandoMensagens = signal(false);

  maxMensal = computed(() => Math.max(1, ...this.mensal().map(m => m.totalAtendimentos)));
  maxDiario = computed(() => Math.max(1, ...this.diario().map(d => d.totalAtendimentos)));

  tituloHistorico = computed(() => `Histórico — ${this.nomeContatoHistorico() || this.whatsappIdHistorico() || ''}`);

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

  aplicarFiltros() {
    this.carregarMensal();
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = { ano: this.anoAtual };
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
    this.whatsappIdHistorico.set(item.whatsappId);
    this.nomeContatoHistorico.set(item.nomeContato ?? null);
    this.mensagens.set([]);
    this.historicoAberto.set(true);
    this.carregandoMensagens.set(true);

    this.atendimentosService.mensagens(item.whatsappId).subscribe({
      next: res => {
        this.mensagens.set(res.dados ?? []);
        this.carregandoMensagens.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o histórico.');
        this.carregandoMensagens.set(false);
      }
    });
  }

  fecharHistorico() {
    this.historicoAberto.set(false);
    this.whatsappIdHistorico.set(null);
    this.nomeContatoHistorico.set(null);
    this.mensagens.set([]);
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

  classeRemetente(quem: string): string {
    return REMETENTE_CLASSES[quem] ?? REMETENTE_CLASSES['Cliente'];
  }
}
