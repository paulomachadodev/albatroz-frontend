import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { DdaService } from '../../services/dda.service';
import { ImportacaoDda, LancamentoDda } from '../../models/dda.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';

const STATUS_LABELS: Record<number, string> = { 1: 'Pendente', 2: 'Conciliado', 3: 'Pago' };
const STATUS_BADGE: Record<number, string>  = { 1: 'badge-warning', 2: 'badge-info', 3: 'badge-success' };

@Component({
  selector: 'app-dda-detalhe',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './dda-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class DdaDetalheComponent implements OnInit {
  importacao  = signal<ImportacaoDda | null>(null);
  lancamentos = signal<LancamentoDda[]>([]);
  carregando  = signal(false);
  processando = signal(false);

  selecionados = signal<Set<number>>(new Set());

  modalVincularAberto    = signal(false);
  lancamentoParaVincular = signal<LancamentoDda | null>(null);
  contaPagarIdVincular   = signal<number | null>(null);

  totalSelecionado = computed(() =>
    this.lancamentos()
      .filter(l => this.selecionados().has(l.id) && l.statusConciliacao === 2)
      .reduce((s, l) => s + l.valor, 0)
  );

  breadcrumbs = computed(() => [
    { label: 'Financeiro' },
    { label: 'Conciliação DDA', url: '/financeiro/dda' },
    { label: this.importacao()?.arquivoNome ?? '...' }
  ]);

  private importacaoId!: number;

  constructor(
    private route: ActivatedRoute,
    private ddaService: DdaService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.importacaoId = Number(this.route.snapshot.paramMap.get('importacaoId'));
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.ddaService.obter(this.importacaoId).subscribe({
      next: res => {
        if (res.dados) {
          this.importacao.set(res.dados.importacao);
          this.lancamentos.set(res.dados.lancamentos);
        }
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Erro ao carregar importação.');
        this.carregando.set(false);
      }
    });
  }

  autoConciliar(): void {
    this.processando.set(true);
    this.ddaService.autoConciliar(this.importacaoId).subscribe({
      next: res => {
        this.toast.sucesso(`${res.dados?.matchados ?? 0} lançamentos conciliados automaticamente.`);
        this.carregar();
        this.processando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Erro ao conciliar.');
        this.processando.set(false);
      }
    });
  }

  abrirModalVincular(lancamento: LancamentoDda): void {
    this.lancamentoParaVincular.set(lancamento);
    this.contaPagarIdVincular.set(null);
    this.modalVincularAberto.set(true);
  }

  fecharModalVincular(): void {
    this.modalVincularAberto.set(false);
    this.lancamentoParaVincular.set(null);
    this.contaPagarIdVincular.set(null);
  }

  confirmarVincular(): void {
    const lancamento = this.lancamentoParaVincular();
    const contaId    = this.contaPagarIdVincular();
    if (!lancamento || !contaId) return;
    this.processando.set(true);
    this.ddaService.vincularManual(this.importacaoId, lancamento.id, contaId).subscribe({
      next: () => {
        this.toast.sucesso('Lançamento vinculado.');
        this.fecharModalVincular();
        this.carregar();
        this.processando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Erro ao vincular.');
        this.processando.set(false);
      }
    });
  }

  desvincular(lancamento: LancamentoDda): void {
    this.processando.set(true);
    this.ddaService.desvincular(lancamento.id).subscribe({
      next: () => {
        this.toast.sucesso('Vínculo removido.');
        this.carregar();
        this.processando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Erro ao desvincular.');
        this.processando.set(false);
      }
    });
  }

  toggleSelecionado(id: number): void {
    const set = new Set(this.selecionados());
    if (set.has(id)) set.delete(id); else set.add(id);
    this.selecionados.set(set);
  }

  baixarSelecionados(): void {
    const ids = this.lancamentos()
      .filter(l => this.selecionados().has(l.id) && l.statusConciliacao === 2)
      .map(l => l.id);

    if (ids.length === 0) {
      this.toast.aviso('Selecione lançamentos conciliados para baixar.');
      return;
    }

    this.processando.set(true);
    this.ddaService.baixar(this.importacaoId, ids).subscribe({
      next: res => {
        this.toast.sucesso(`${res.dados?.baixados ?? 0} contas baixadas com sucesso.`);
        this.selecionados.set(new Set());
        this.carregar();
        this.processando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Erro ao baixar.');
        this.processando.set(false);
      }
    });
  }

  statusLabel(status: number): string { return STATUS_LABELS[status] ?? '?'; }
  statusBadge(status: number): string { return STATUS_BADGE[status] ?? 'badge-ghost'; }
}
