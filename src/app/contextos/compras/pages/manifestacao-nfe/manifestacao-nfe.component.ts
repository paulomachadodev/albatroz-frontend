import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManifestacaoNfeService } from '../../services/manifestacao-nfe.service';
import { NfeSefaz, NotaManifestacaoResumo } from '../../models/manifestacao-nfe.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

type Aba = 'sefaz' | 'notas';

@Component({
  selector: 'app-manifestacao-nfe',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent, ModalComponent],
  templateUrl: './manifestacao-nfe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ManifestacaoNfeComponent implements OnInit {
  abaAtiva = signal<Aba>('sefaz');
  carregando = signal(false);
  consultando = signal(false);

  nfesSefaz = signal<NfeSefaz[]>([]);
  notas = signal<NotaManifestacaoResumo[]>([]);

  chaveEmAcao = signal<string | null>(null);
  notaEmAcao = signal<number | null>(null);

  modalJustificativa = signal(false);
  chaveParaNaoRealizada = signal<string | null>(null);
  justificativa = '';

  constructor(
    private service: ManifestacaoNfeService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregarNotas();
  }

  alternarAba(aba: Aba) {
    this.abaAtiva.set(aba);
    if (aba === 'notas') {
      this.carregarNotas();
    }
  }

  consultarSefaz() {
    this.consultando.set(true);
    this.service.consultarSefaz().subscribe({
      next: res => {
        this.consultando.set(false);
        const lista = (res.dados as any) ?? [];
        this.nfesSefaz.set(lista);
        if (lista.length === 0) {
          this.toast.info('Nenhuma NF-e nova disponível no SEFAZ.');
        } else {
          this.toast.sucesso(`${lista.length} NF-e(s) encontrada(s) no SEFAZ.`);
        }
      },
      error: err => {
        this.consultando.set(false);
        const msg = err?.error?.erro ?? 'Falha ao consultar o SEFAZ.';
        this.toast.erro(msg);
      }
    });
  }

  carregarNotas() {
    this.carregando.set(true);
    this.service.listarNotas().subscribe({
      next: res => {
        this.carregando.set(false);
        this.notas.set((res.dados as any) ?? []);
      },
      error: err => {
        this.carregando.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar as notas.');
      }
    });
  }

  registrarCiencia(chave: string) {
    this.chaveEmAcao.set(chave);
    this.service.registrarCiencia(chave).subscribe({
      next: () => {
        this.chaveEmAcao.set(null);
        this.toast.sucesso('Ciência da operação registrada.');
        this.atualizarStatusLocal(chave, 'ciencia');
      },
      error: err => {
        this.chaveEmAcao.set(null);
        const msg = err?.error?.erro ?? 'Falha ao registrar ciência.';
        this.toast.erro(msg);
      }
    });
  }

  registrarConfirmacao(chave: string) {
    this.chaveEmAcao.set(chave);
    this.service.registrarConfirmacao(chave).subscribe({
      next: () => {
        this.chaveEmAcao.set(null);
        this.toast.sucesso('Confirmação da operação registrada.');
        this.atualizarStatusLocal(chave, 'confirmada');
      },
      error: err => {
        this.chaveEmAcao.set(null);
        const msg = err?.error?.erro ?? 'Falha ao registrar confirmação.';
        this.toast.erro(msg);
      }
    });
  }

  abrirModalNaoRealizada(chave: string) {
    this.chaveParaNaoRealizada.set(chave);
    this.justificativa = '';
    this.modalJustificativa.set(true);
  }

  fecharModal() {
    this.modalJustificativa.set(false);
    this.chaveParaNaoRealizada.set(null);
    this.justificativa = '';
  }

  confirmarNaoRealizada() {
    const chave = this.chaveParaNaoRealizada();
    if (!chave || !this.justificativa.trim()) return;
    this.fecharModal();
    this.chaveEmAcao.set(chave);
    this.service.registrarNaoRealizada(chave, this.justificativa).subscribe({
      next: () => {
        this.chaveEmAcao.set(null);
        this.toast.sucesso('Operação não realizada registrada.');
        this.atualizarStatusLocal(chave, 'nao_realizada');
      },
      error: err => {
        this.chaveEmAcao.set(null);
        const msg = err?.error?.erro ?? 'Falha ao registrar operação não realizada.';
        this.toast.erro(msg);
      }
    });
  }

  private atualizarStatusLocal(chave: string, status: string) {
    this.nfesSefaz.update(lista =>
      lista.map(n => n.chaveNfe === chave ? { ...n, podeManifestacao: false } : n)
    );
    this.notas.update(lista =>
      lista.map(n => n.chaveAcesso === chave ? { ...n, manifestacaoStatus: status } : n)
    );
  }

  rotuloManifestacao(status: string | null): string {
    const rotulos: Record<string, string> = {
      ciencia:       'Ciência',
      confirmada:    'Confirmada',
      desconhecida:  'Desconhecimento',
      nao_realizada: 'Não Realizada'
    };
    return status ? (rotulos[status] ?? status) : '-';
  }

  classeManifestacao(status: string | null): string {
    switch (status) {
      case 'ciencia':       return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 'confirmada':    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'desconhecida':  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
      case 'nao_realizada': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      default:              return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  }

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarData(valor: string | null): string {
    if (!valor) return '-';
    try { return formatDate(valor, 'dd/MM/yyyy', 'pt-BR'); } catch { return '-'; }
  }

  formatarChave(chave: string): string {
    return chave.length === 44 ? `...${chave.slice(-8)}` : chave;
  }
}
