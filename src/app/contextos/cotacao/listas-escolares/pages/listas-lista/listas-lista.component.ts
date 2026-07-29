import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListasEscolaresService, ListaEscolarFiltro } from '../../services/listas-escolares.service';
import { ListaEscolarResumo } from '../../models/lista-escolar.model';
import { ToastService } from '../../../../../core/feedback/toast.service';

@Component({
  selector: 'app-listas-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './listas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ListasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<ListaEscolarResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  readonly tamanho = 20;

  filtro: ListaEscolarFiltro = {};

  constructor(
    private listasService: ListasEscolaresService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.listasService.listar({ pagina, tamanho: this.tamanho }, this.filtro).subscribe({
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

  paginaAnterior() {
    if (this.paginaAtual() > 1) this.carregar(this.paginaAtual() - 1);
  }

  proximaPagina() {
    if (this.paginaAtual() < this.totalPaginas()) this.carregar(this.paginaAtual() + 1);
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
