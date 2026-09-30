import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PedidosCompraService, PedidoCompraFiltro } from '../../services/pedidos-compra.service';
import { PedidoCompraResumo, SITUACAO_PEDIDO_COMPRA, ROTULOS_SITUACAO_PEDIDO_COMPRA, CLASSES_SITUACAO_PEDIDO_COMPRA } from '../../models/pedido-compra.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { exportarPlanilha } from '../../../../shared/utils/exportar-planilha';

@Component({
  selector: 'app-pedidos-compra-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, ListagemPaginadaComponent, PageHeaderComponent, ThOrdenavelComponent, BreadcrumbComponent],
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
  ordenacaoAtual = signal<Ordenacao | null>(null);
  exportandoId = signal<number | null>(null);

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
  limparFiltros() { this.filtro = {}; this.ordenacaoAtual.set(null); this.carregar(1); }
  aoMudarPagina(pagina: number) { this.carregar(pagina); }
  aoMudarTamanhoPagina(tamanho: number) { this.tamanhoPagina.set(tamanho); this.carregar(1); }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.filtro.ordenarPor = ordenacao.campo;
    this.filtro.direcao = ordenacao.direcao;
    this.carregar(1);
  }

  rotuloSituacao(situacao: number): string { return ROTULOS_SITUACAO_PEDIDO_COMPRA[situacao] ?? '-'; }
  classeSituacao(situacao: number): string { return CLASSES_SITUACAO_PEDIDO_COMPRA[situacao] ?? CLASSES_SITUACAO_PEDIDO_COMPRA[1]; }

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

  exportarItem(item: PedidoCompraResumo, formato: 'xlsx' | 'csv') {
    this.exportandoId.set(item.id);
    this.pedidosService.obter(item.id).subscribe({
      next: res => {
        this.exportandoId.set(null);
        const detalhe = res.dados;
        if (!detalhe || detalhe.itens.length === 0) {
          this.toast.erro('Pedido sem itens para exportar.');
          return;
        }
        const linhas = detalhe.itens.map(linha => ({
          'Fornecedor': detalhe.fornecedor,
          'Código': linha.codigo,
          'Produto': linha.nome,
          'Quantidade': linha.quantidade,
          'Preço Custo Unit.': linha.precoCustoUnitario,
          'Valor Total': linha.valorTotal
        }));
        exportarPlanilha(linhas, `pedido-compra-${detalhe.id}`, 'Itens', formato);
      },
      error: err => {
        this.exportandoId.set(null);
        this.toast.erroServidor(err, 'Não foi possível exportar o pedido.');
      }
    });
  }
}
