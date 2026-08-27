import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PedidosCompraService, PedidoCompraFiltro } from '../../services/pedidos-compra.service';
import { PedidoCompraResumo, SITUACAO_PEDIDO_COMPRA } from '../../models/pedido-compra.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

const ROTULOS_SITUACAO: Record<number, string> = { 1: 'Rascunho', 2: 'Pronto', 3: 'Enviado', 4: 'Cancelado' };
const CLASSES_SITUACAO: Record<number, string> = {
  1: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  4: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
};

@Component({
  selector: 'app-pedidos-compra-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, ListagemPaginadaComponent, PageHeaderComponent],
  templateUrl: './pedidos-compra-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class PedidosCompraListaComponent implements OnInit {
  readonly situacaoEnum = SITUACAO_PEDIDO_COMPRA;

  carregando = signal(true);
  itens = signal<PedidoCompraResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);

  filtro: PedidoCompraFiltro = {};

  constructor(
    private pedidosService: PedidosCompraService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.pedidosService.listar({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os pedidos de compra.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() { this.carregar(1); }
  limparFiltros() { this.filtro = {}; this.carregar(1); }
  aoMudarPagina(pagina: number) { this.carregar(pagina); }
  aoMudarTamanhoPagina(tamanho: number) { this.tamanhoPagina.set(tamanho); this.carregar(1); }

  rotuloSituacao(situacao: number): string { return ROTULOS_SITUACAO[situacao] ?? '-'; }
  classeSituacao(situacao: number): string { return CLASSES_SITUACAO[situacao] ?? CLASSES_SITUACAO[1]; }

  mudarSituacao(item: PedidoCompraResumo, situacao: number) {
    this.pedidosService.atualizarStatus(item.id, situacao).subscribe({
      next: () => { this.toast.sucesso('Situação atualizada.'); this.carregar(this.paginaAtual()); },
      error: err => this.toast.erroServidor(err, 'Não foi possível atualizar a situação.')
    });
  }

  async excluir(item: PedidoCompraResumo) {
    const confirmado = await this.confirm.confirmar(
      `Excluir o pedido de compra #${item.id} (${item.fornecedor})?`, undefined, { textoConfirmar: 'Excluir' }
    );
    if (!confirmado) return;

    this.pedidosService.excluir(item.id).subscribe({
      next: () => { this.toast.sucesso('Pedido excluído.'); this.carregar(this.paginaAtual()); },
      error: err => this.toast.erroServidor(err, 'Não foi possível excluir o pedido.')
    });
  }

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
