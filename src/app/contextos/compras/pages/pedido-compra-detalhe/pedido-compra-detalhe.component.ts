import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { PedidosCompraService } from '../../services/pedidos-compra.service';
import {
  PedidoCompraDetalhe,
  SITUACAO_PEDIDO_COMPRA,
  SITUACOES_EDITAVEIS_PEDIDO_COMPRA,
  ROTULOS_SITUACAO_PEDIDO_COMPRA,
  CLASSES_SITUACAO_PEDIDO_COMPRA
} from '../../models/pedido-compra.model';
import { ProdutosService } from '../../../produtos/services/produtos.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { exportarPlanilha } from '../../../../shared/utils/exportar-planilha';

interface ItemPedidoEdicao {
  idProduto: number;
  codigo: string;
  nome: string;
  quantidade: number;
  precoCustoUnitario: number | null;
  valorTotal: number | null;
}

@Component({
  selector: 'app-pedido-compra-detalhe',
  standalone: true,
  imports: [FormsModule, SelectBuscaComponent, BreadcrumbComponent],
  templateUrl: './pedido-compra-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class PedidoCompraDetalheComponent implements OnInit {
  readonly situacaoEnum = SITUACAO_PEDIDO_COMPRA;

  idPedido!: number;
  carregando = signal(true);
  pedido = signal<PedidoCompraDetalhe | null>(null);
  itensEdicao = signal<ItemPedidoEdicao[]>([]);
  alterado = signal(false);
  salvando = signal(false);
  exportando = signal(false);

  private produtosEncontrados = new Map<number, { id: number; codigo: string; nome: string }>();

  editavel = computed(() => {
    const p = this.pedido();
    return !!p && SITUACOES_EDITAVEIS_PEDIDO_COMPRA.includes(p.situacao);
  });

  valorTotalEdicao = computed(() =>
    this.itensEdicao().reduce((soma, item) => soma + (item.valorTotal ?? item.quantidade * (item.precoCustoUnitario ?? 0)), 0)
  );

  buscarProdutoParaAdicionar = (termo: string): Observable<OpcaoSelectBusca[]> =>
    this.produtosService.listar({ pagina: 1, tamanho: 10 }, { texto: termo, situacao: 'A' }).pipe(
      map(res => {
        const produtos = res.dados?.dados ?? [];
        for (const p of produtos) this.produtosEncontrados.set(p.id, { id: p.id, codigo: p.codigo, nome: p.nome });
        return produtos.map(p => ({ id: p.id, nome: `${p.codigo} — ${p.nome}` }));
      })
    );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidosService: PedidosCompraService,
    private produtosService: ProdutosService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.idPedido = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.pedidosService.obter(this.idPedido).subscribe({
      next: res => {
        const detalhe = res.dados ?? null;
        this.pedido.set(detalhe);
        this.itensEdicao.set((detalhe?.itens ?? []).map(item => ({ ...item })));
        this.alterado.set(false);
        this.carregando.set(false);
      },
      error: err => {
        this.pedido.set(null);
        this.carregando.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar o pedido de compra.');
      }
    });
  }

  rotuloSituacao(situacao: number): string { return ROTULOS_SITUACAO_PEDIDO_COMPRA[situacao] ?? '-'; }
  classeSituacao(situacao: number): string { return CLASSES_SITUACAO_PEDIDO_COMPRA[situacao] ?? CLASSES_SITUACAO_PEDIDO_COMPRA[1]; }

  mudarSituacao(situacao: number) {
    this.pedidosService.atualizarStatus(this.idPedido, situacao).subscribe({
      next: () => { this.toast.sucesso('Situação atualizada.'); this.carregar(); },
      error: err => this.toast.erroServidor(err, 'Não foi possível atualizar a situação.')
    });
  }

  alterarQuantidade(item: ItemPedidoEdicao, valor: string) {
    const quantidade = Number(valor);
    if (Number.isNaN(quantidade) || quantidade <= 0) return;
    this.itensEdicao.update(itens => itens.map(i => i.idProduto === item.idProduto ? { ...i, quantidade } : i));
    this.alterado.set(true);
  }

  removerItem(item: ItemPedidoEdicao) {
    this.itensEdicao.update(itens => itens.filter(i => i.idProduto !== item.idProduto));
    this.alterado.set(true);
  }

  aoSelecionarProdutoNovo(opcao: OpcaoSelectBusca | null) {
    if (!opcao) return;
    const produto = this.produtosEncontrados.get(opcao.id);
    if (!produto) return;

    const jaExiste = this.itensEdicao().some(i => i.idProduto === produto.id);
    if (jaExiste) {
      this.itensEdicao.update(itens => itens.map(i => i.idProduto === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
    } else {
      this.itensEdicao.update(itens => [...itens, {
        idProduto: produto.id, codigo: produto.codigo, nome: produto.nome,
        quantidade: 1, precoCustoUnitario: null, valorTotal: null
      }]);
    }
    this.alterado.set(true);
  }

  salvar() {
    const itens = this.itensEdicao();
    if (itens.length === 0) {
      this.toast.erro('O pedido precisa ter ao menos um item.');
      return;
    }

    this.salvando.set(true);
    this.pedidosService.atualizarItens(this.idPedido, itens.map(i => ({ idProduto: i.idProduto, quantidade: i.quantidade }))).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Pedido atualizado.');
        this.carregar();
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar as alterações.');
      }
    });
  }

  descartarAlteracoes() {
    this.carregar();
  }

  async excluir() {
    const pedido = this.pedido();
    if (!pedido) return;
    const confirmado = await this.confirm.confirmar(
      `Excluir o pedido de compra #${pedido.id} (${pedido.fornecedor})?`, undefined, { textoConfirmar: 'Excluir' }
    );
    if (!confirmado) return;

    this.pedidosService.excluir(pedido.id).subscribe({
      next: () => { this.toast.sucesso('Pedido excluído.'); this.router.navigate(['/compras/pedidos']); },
      error: err => this.toast.erroServidor(err, 'Não foi possível excluir o pedido.')
    });
  }

  exportar(formato: 'xlsx' | 'csv') {
    const pedido = this.pedido();
    if (!pedido) return;
    if (this.alterado()) {
      this.toast.erro('Salve as alterações antes de exportar.');
      return;
    }
    if (pedido.itens.length === 0) {
      this.toast.erro('Pedido sem itens para exportar.');
      return;
    }

    const linhas = pedido.itens.map(item => ({
      'Fornecedor': pedido.fornecedor,
      'Código': item.codigo,
      'Produto': item.nome,
      'Quantidade': item.quantidade,
      'Preço Custo Unit.': item.precoCustoUnitario,
      'Valor Total': item.valorTotal
    }));
    exportarPlanilha(linhas, `pedido-compra-${pedido.id}`, 'Itens', formato);
  }

  formatarReais(valor?: number | null): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
