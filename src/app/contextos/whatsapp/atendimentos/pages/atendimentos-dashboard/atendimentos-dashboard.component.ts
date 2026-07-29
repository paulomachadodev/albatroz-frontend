import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AtendimentosWhatsappService, AtendimentoWhatsappFiltro } from '../../services/atendimentos-whatsapp.service';
import { AtendimentoWhatsappResumo, AtendimentoWhatsappMensal } from '../../models/atendimento-whatsapp.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ContatosService } from '../../../../contatos/services/contatos.service';
import { ContatoBusca } from '../../../../contatos/models/contato-busca.model';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Component({
  selector: 'app-atendimentos-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './atendimentos-dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class AtendimentosDashboardComponent implements OnInit {
  carregando = signal(true);
  itens = signal<AtendimentoWhatsappResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  readonly tamanho = 20;

  mensal = signal<AtendimentoWhatsappMensal[]>([]);
  processandoVinculo = signal(false);
  vinculandoWhatsappId = signal<string | null>(null);
  contatoSelecionado = signal<ContatoBusca | null>(null);
  termoContato = '';
  resultadosContato = signal<ContatoBusca[]>([]);
  buscandoContato = signal(false);
  private debounceContato?: ReturnType<typeof setTimeout>;

  anoAtual = new Date().getFullYear();
  filtro: AtendimentoWhatsappFiltro = { ano: this.anoAtual };

  maxMensal = computed(() => Math.max(1, ...this.mensal().map(m => m.totalAtendimentos)));

  constructor(
    private atendimentosService: AtendimentosWhatsappService,
    private contatosService: ContatosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregarMensal();
    this.carregar();
  }

  carregarMensal() {
    this.atendimentosService.porMes(this.filtro.ano ?? this.anoAtual).subscribe({
      next: res => this.mensal.set(res.dados ?? [])
    });
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.atendimentosService.listar({ pagina, tamanho: this.tamanho }, this.filtro).subscribe({
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

  paginaAnterior() {
    if (this.paginaAtual() > 1) this.carregar(this.paginaAtual() - 1);
  }

  proximaPagina() {
    if (this.paginaAtual() < this.totalPaginas()) this.carregar(this.paginaAtual() + 1);
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

  abrirVinculoManual(item: AtendimentoWhatsappResumo) {
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

  labelMes(mes: number): string {
    return MESES[mes - 1] ?? String(mes);
  }

  barraAltura(total: number): string {
    return `${Math.max(4, (total / this.maxMensal()) * 100)}%`;
  }
}
