import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContasPagarService } from '../../services/contas-pagar.service';
import { ContaPagar, CriarContaPagarRequisicao, DarBaixaContaPagarRequisicao, FiltroVencimento } from '../../models/conta-pagar.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';

@Component({
  selector: 'app-contas-pagar-lista',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent],
  templateUrl: './contas-pagar-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContasPagarListaComponent implements OnInit {
  carregando    = signal(true);
  itens         = signal<ContaPagar[]>([]);
  totalRegistros = signal(0);
  paginaAtual   = signal(1);
  totalPaginas  = signal(1);
  tamanhoPagina = signal(20);

  filtroVencimento: FiltroVencimento = 'todas';
  filtroSituacao: number | undefined;
  filtroBusca = '';

  modalBaixaAberta = signal(false);
  contaBaixando    = signal<ContaPagar | null>(null);
  dataPagamentoBaixa = '';
  valorBaixa = 0;
  salvandoBaixa = signal(false);

  modalCriarAberta = signal(false);
  salvandoCriar = signal(false);
  formCriar: CriarContaPagarRequisicao = {
    idContato: null, valor: 0, historico: null,
    dataVencimento: '', competencia: '',
    numeroDocumento: null, parcela: null, numeroParcelas: null
  };

  constructor(private service: ContasPagarService, private toast: ToastService) {}

  ngOnInit() {
    this.carregar(1);
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    this.service.listar(
      this.filtroVencimento,
      { pagina, tamanho: this.tamanhoPagina() },
      this.filtroSituacao,
      this.filtroBusca || undefined
    ).subscribe({
      next: res => {
        const d = res.dados as any;
        this.itens.set(d?.dados ?? []);
        this.totalRegistros.set(d?.totalRegistros ?? 0);
        this.paginaAtual.set(d?.paginaAtual ?? 1);
        this.totalPaginas.set(d?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as contas a pagar.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() { this.carregar(1); }

  limparFiltros() {
    this.filtroVencimento = 'todas';
    this.filtroSituacao = undefined;
    this.filtroBusca = '';
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) { this.carregar(pagina); }
  aoMudarTamanhoPagina(tamanho: number) { this.tamanhoPagina.set(tamanho); this.carregar(1); }

  abrirModalBaixa(conta: ContaPagar, event: Event) {
    event.stopPropagation();
    this.contaBaixando.set(conta);
    this.dataPagamentoBaixa = this.hoje();
    this.valorBaixa = conta.saldo;
    this.modalBaixaAberta.set(true);
  }

  fecharModalBaixa() {
    this.modalBaixaAberta.set(false);
    this.contaBaixando.set(null);
  }

  confirmarBaixa() {
    const conta = this.contaBaixando();
    if (!conta) return;
    const body: DarBaixaContaPagarRequisicao = {
      dataPagamento: this.dataPagamentoBaixa,
      valorPago: this.valorBaixa
    };
    this.salvandoBaixa.set(true);
    this.service.darBaixa(conta.id, body).subscribe({
      next: () => {
        this.salvandoBaixa.set(false);
        this.fecharModalBaixa();
        this.toast.sucesso('Conta baixada com sucesso.');
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.salvandoBaixa.set(false);
        this.toast.erroServidor(err, 'Não foi possível dar baixa na conta.');
      }
    });
  }

  abrirModalCriar() {
    const hoje = this.hoje();
    this.formCriar = {
      idContato: null, valor: 0, historico: null,
      dataVencimento: hoje, competencia: hoje,
      numeroDocumento: null, parcela: null, numeroParcelas: null
    };
    this.modalCriarAberta.set(true);
  }

  fecharModalCriar() { this.modalCriarAberta.set(false); }

  confirmarCriar() {
    if (!this.formCriar.valor || !this.formCriar.dataVencimento || !this.formCriar.competencia) {
      this.toast.erro('Preencha os campos obrigatórios: valor, vencimento e competência.');
      return;
    }
    this.salvandoCriar.set(true);
    this.service.criar(this.formCriar).subscribe({
      next: () => {
        this.salvandoCriar.set(false);
        this.fecharModalCriar();
        this.toast.sucesso('Conta a pagar criada com sucesso.');
        this.carregar(1);
      },
      error: err => {
        this.salvandoCriar.set(false);
        this.toast.erroServidor(err, 'Não foi possível criar a conta.');
      }
    });
  }

  rotuloSituacao(situacao: number): string {
    return situacao === 2 ? 'Pago' : 'Em aberto';
  }

  classeSituacao(situacao: number): string {
    return situacao === 2
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  }

  formatarReais(valor: number | null | undefined): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarData(valor: string | null | undefined): string {
    if (!valor) return '-';
    try { return formatDate(valor, 'dd/MM/yyyy', 'pt-BR'); } catch { return '-'; }
  }

  private hoje(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
