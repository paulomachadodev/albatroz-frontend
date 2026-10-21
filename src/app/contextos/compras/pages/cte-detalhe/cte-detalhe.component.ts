import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CtesService } from '../../services/ctes.service';
import { CteDetalhe, CteNotaVinculada, PreviewRateioCte } from '../../models/cte.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-cte-detalhe',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent, ModalComponent],
  templateUrl: './cte-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class CteDetalheComponent implements OnInit {
  carregando = signal(true);
  cte = signal<CteDetalhe | null>(null);

  carregandoPreview = signal(false);
  preview = signal<PreviewRateioCte | null>(null);
  modalPreviewAberto = signal(false);

  modalVincularAberto = signal(false);
  notaIdParaVincular = '';
  vinculando = signal(false);

  desvinculando = signal<number | null>(null);
  confirmando = signal(false);

  constructor(
    private service: CtesService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar(id);
  }

  get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  carregar(id: number) {
    this.carregando.set(true);
    this.service.obter(id).subscribe({
      next: res => {
        this.cte.set(res.dados ?? null);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o CT-e.');
        this.carregando.set(false);
      }
    });
  }

  abrirPreview() {
    const cte = this.cte();
    if (!cte) return;
    this.carregandoPreview.set(true);
    this.modalPreviewAberto.set(true);
    this.service.previewRateio(cte.id).subscribe({
      next: res => {
        this.preview.set(res.dados ?? null);
        this.carregandoPreview.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível calcular o preview do rateio.');
        this.carregandoPreview.set(false);
        this.modalPreviewAberto.set(false);
      }
    });
  }

  fecharPreview() {
    this.modalPreviewAberto.set(false);
    this.preview.set(null);
  }

  abrirModalVincular() {
    this.notaIdParaVincular = '';
    this.modalVincularAberto.set(true);
  }

  fecharModalVincular() { this.modalVincularAberto.set(false); }

  vincularNota() {
    const cte = this.cte();
    const notaId = Number(this.notaIdParaVincular);
    if (!cte || !notaId) {
      this.toast.erro('Informe o ID da nota de entrada.');
      return;
    }
    this.vinculando.set(true);
    this.service.vincularNota(cte.id, notaId).subscribe({
      next: () => {
        this.vinculando.set(false);
        this.toast.sucesso('Nota vinculada ao CT-e.');
        this.fecharModalVincular();
        this.carregar(cte.id);
      },
      error: err => {
        this.vinculando.set(false);
        this.toast.erro(err?.error?.erro ?? 'Não foi possível vincular a nota.');
      }
    });
  }

  desvincularNota(nota: CteNotaVinculada) {
    const cte = this.cte();
    if (!cte) return;
    this.desvinculando.set(nota.idNotaEntrada);
    this.service.desvincularNota(cte.id, nota.idNotaEntrada).subscribe({
      next: () => {
        this.desvinculando.set(null);
        this.toast.sucesso('Nota desvinculada.');
        this.carregar(cte.id);
      },
      error: err => {
        this.desvinculando.set(null);
        this.toast.erro(err?.error?.erro ?? 'Não foi possível desvincular a nota.');
      }
    });
  }

  confirmar() {
    const cte = this.cte();
    if (!cte) return;
    this.confirmando.set(true);
    this.service.confirmar(cte.id).subscribe({
      next: () => {
        this.confirmando.set(false);
        this.toast.sucesso('CT-e confirmado! Frete rateado nas notas vinculadas.');
        this.carregar(cte.id);
      },
      error: err => {
        this.confirmando.set(false);
        const mensagem = err?.error?.erro ?? 'Não foi possível confirmar o CT-e.';
        this.toast.erro(mensagem);
      }
    });
  }

  podeConfirmar(): boolean {
    const c = this.cte();
    return !!c && c.status !== 3 && c.status !== 4 && c.notas.length > 0;
  }

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

  rotuloStatusNota(status: number): string {
    const r: Record<number, string> = { 1: 'Rascunho', 2: 'Conferindo', 3: 'Confirmada', 4: 'Cancelada', 5: 'Manifestada' };
    return r[status] ?? '-';
  }

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarData(valor: string | null): string {
    if (!valor) return '-';
    try { return formatDate(valor, 'dd/MM/yyyy', 'pt-BR'); } catch { return '-'; }
  }

  voltar() { this.router.navigate(['/compras/ctes']); }
}
