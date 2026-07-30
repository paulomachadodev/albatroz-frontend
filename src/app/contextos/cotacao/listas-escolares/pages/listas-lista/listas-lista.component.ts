import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListasEscolaresService, ListaEscolarFiltro } from '../../services/listas-escolares.service';
import { ListaEscolarResumo } from '../../models/lista-escolar.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-listas-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ListagemPaginadaComponent, PageHeaderComponent],
  templateUrl: './listas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ListasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<ListaEscolarResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(20);

  filtro: ListaEscolarFiltro = {};
  enviandoArquivo = signal(false);

  constructor(
    private listasService: ListasEscolaresService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.listasService.listar({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as listas.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = {};
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

    this.enviandoArquivo.set(true);
    this.listasService.enviarArquivo(arquivo).subscribe({
      next: () => {
        this.toast.sucesso('Lista enviada pra Albia cotar — aparece na listagem assim que terminar.');
        this.enviandoArquivo.set(false);
        input.value = '';
        this.carregar(1);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível enviar o arquivo.');
        this.enviandoArquivo.set(false);
        input.value = '';
      }
    });
  }

  classeStatus(status: string): string {
    const mapa: Record<string, string> = {
      liberada:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      cotada:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      'existente': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      're-cotada': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    };
    return mapa[status] ?? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }

  formatarReais(valor?: number): string {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
