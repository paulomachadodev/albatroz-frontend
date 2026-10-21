import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CtesService } from '../../services/ctes.service';
import { CteResumo } from '../../models/cte.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-ctes-lista',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent, ModalComponent],
  templateUrl: './ctes-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class CtesListaComponent implements OnInit {
  carregando = signal(true);
  importando = signal(false);
  itens = signal<CteResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(20);

  filtroStatus: number | undefined;

  modalManualAberto = signal(false);
  salvandoManual = signal(false);
  formManual: {
    numeroCte: string;
    serie: string;
    dataEmissao: string;
    modalidade: string;
    valorFrete: number;
    metodoRateio: string;
  } = { numeroCte: '', serie: '', dataEmissao: '', modalidade: 'rodoviario', valorFrete: 0, metodoRateio: 'valor' };

  constructor(
    private service: CtesService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregar(1);
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    this.service.listar(pagina, this.tamanhoPagina(), this.filtroStatus).subscribe({
      next: res => {
        const d = res.dados as any;
        this.itens.set(d?.dados ?? []);
        this.totalRegistros.set(d?.totalRegistros ?? 0);
        this.paginaAtual.set(d?.paginaAtual ?? 1);
        this.totalPaginas.set(d?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os CT-e.');
        this.carregando.set(false);
      }
    });
  }

  aoMudarPagina(pagina: number) { this.carregar(pagina); }
  aoMudarTamanhoPagina(tamanho: number) { this.tamanhoPagina.set(tamanho); this.carregar(1); }

  aoSelecionarArquivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    input.value = '';
    this.importando.set(true);
    this.service.importarXml(arquivo).subscribe({
      next: res => {
        this.importando.set(false);
        this.toast.sucesso('CT-e importado com sucesso.');
        if (res.dados?.id) this.router.navigate(['/compras/ctes', res.dados.id]);
        else this.carregar(1);
      },
      error: err => {
        this.importando.set(false);
        this.toast.erro(err?.error?.erro ?? 'Não foi possível importar o XML.');
      }
    });
  }

  abrirModalManual() {
    this.formManual = { numeroCte: '', serie: '', dataEmissao: '', modalidade: 'rodoviario', valorFrete: 0, metodoRateio: 'valor' };
    this.modalManualAberto.set(true);
  }

  fecharModalManual() { this.modalManualAberto.set(false); }

  salvarManual() {
    if (!this.formManual.valorFrete || this.formManual.valorFrete <= 0) {
      this.toast.erro('Informe o valor do frete.');
      return;
    }
    this.salvandoManual.set(true);
    this.service.criarManual({
      numeroCte: this.formManual.numeroCte || undefined,
      serie: this.formManual.serie || undefined,
      dataEmissao: this.formManual.dataEmissao || undefined,
      modalidade: this.formManual.modalidade,
      valorFrete: this.formManual.valorFrete,
      metodoRateio: this.formManual.metodoRateio
    }).subscribe({
      next: res => {
        this.salvandoManual.set(false);
        this.toast.sucesso('CT-e criado.');
        this.fecharModalManual();
        if (res.dados?.id) this.router.navigate(['/compras/ctes', res.dados.id]);
      },
      error: err => {
        this.salvandoManual.set(false);
        this.toast.erro(err?.error?.erro ?? 'Não foi possível criar o CT-e.');
      }
    });
  }

  abrirCte(id: number) { this.router.navigate(['/compras/ctes', id]); }

  rotuloStatus(status: number): string {
    const r: Record<number, string> = { 1: 'Rascunho', 2: 'Vinculado', 3: 'Confirmado', 4: 'Cancelado' };
    return r[status] ?? '-';
  }

  classeStatus(status: number): string {
    switch (status) {
      case 1: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
      case 2: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 3: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 4: return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-500';
    }
  }

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarData(valor: string | null): string {
    if (!valor) return '-';
    try { return formatDate(valor, 'dd/MM/yyyy', 'pt-BR'); } catch { return '-'; }
  }
}
