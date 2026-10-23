import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotasEntradaService } from '../../services/notas-entrada.service';
import { NotaEntradaResumo } from '../../models/nota-entrada.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';

@Component({
  selector: 'app-notas-entrada-lista',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent],
  templateUrl: './notas-entrada-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class NotasEntradaListaComponent implements OnInit {
  carregando = signal(true);
  importando = signal(false);
  itens = signal<NotaEntradaResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(20);

  filtroStatus: number | undefined;
  filtroBusca = '';

  constructor(
    private service: NotasEntradaService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregar(1);
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    this.service.listar(pagina, this.tamanhoPagina(), this.filtroStatus, this.filtroBusca || undefined).subscribe({
      next: res => {
        const d = res.dados as any;
        this.itens.set(d?.dados ?? []);
        this.totalRegistros.set(d?.totalRegistros ?? 0);
        this.paginaAtual.set(d?.paginaAtual ?? 1);
        this.totalPaginas.set(d?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as notas de entrada.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtroStatus = undefined;
    this.filtroBusca = '';
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  aoSelecionarArquivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    input.value = '';
    this.importarXml(arquivo);
  }

  importarXml(arquivo: File) {
    this.importando.set(true);
    this.service.importarXml(arquivo).subscribe({
      next: res => {
        this.importando.set(false);
        this.toast.sucesso('NF-e importada com sucesso.');
        if (res.dados?.id) {
          this.router.navigate(['/compras/notas-entrada', res.dados.id]);
        } else {
          this.carregar(1);
        }
      },
      error: err => {
        this.importando.set(false);
        const mensagem = err?.error?.erro ?? 'Não foi possível importar o XML.';
        this.toast.erro(mensagem);
      }
    });
  }

  abrirNota(id: number) {
    this.router.navigate(['/compras/notas-entrada', id]);
  }

  abrirConferencia(id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/compras/notas-entrada', id, 'conferencia']);
  }

  registrandoChegada = signal<number | null>(null);

  registrarChegada(id: number, event: Event) {
    event.stopPropagation();
    this.registrandoChegada.set(id);
    this.service.registrarChegada(id).subscribe({
      next: () => {
        this.registrandoChegada.set(null);
        this.toast.sucesso('Mercadoria registrada como chegou.');
        this.router.navigate(['/compras/notas-entrada', id, 'conferencia']);
      },
      error: err => {
        this.registrandoChegada.set(null);
        const msg = err?.error?.erro ?? 'Não foi possível registrar a chegada.';
        this.toast.erro(msg);
      }
    });
  }

  rotuloStatus(status: number): string {
    const rotulos: Record<number, string> = {
      1: 'Rascunho', 2: 'Conferindo', 3: 'Confirmada', 4: 'Cancelada', 5: 'Manifestada'
    };
    return rotulos[status] ?? 'Desconhecido';
  }

  classeStatus(status: number): string {
    switch (status) {
      case 1: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
      case 2: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 3: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 4: return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      case 5: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
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
