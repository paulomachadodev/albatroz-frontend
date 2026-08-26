import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComprasService, SugestaoCompraFiltro } from '../../services/compras.service';
import { SugestaoCompra } from '../../models/sugestao-compra.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { MarcasService } from '../../../produtos/services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';

@Component({
  selector: 'app-compras-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, ListagemPaginadaComponent, PageHeaderComponent, ThOrdenavelComponent, SelectBuscaComponent],
  templateUrl: './compras-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ComprasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<SugestaoCompra[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(20);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtro: SugestaoCompraFiltro = {};
  marcaSelecionada: OpcaoSelectBusca | null = null;
  fornecedorSelecionado: OpcaoSelectBusca | null = null;

  buscarMarcas = (termo: string) => this.marcasService.buscar(termo);
  buscarFornecedores = (termo: string) => this.contatosService.buscar(termo, 'Fornecedor');

  constructor(
    private comprasService: ComprasService,
    private marcasService: MarcasService,
    private contatosService: ContatosService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    const estado = this.comprasService.estadoLista;
    if (estado) {
      this.filtro = { ...estado.filtro };
      this.tamanhoPagina.set(estado.tamanhoPagina);
      if (this.filtro.ordenarPor && this.filtro.direcao) {
        this.ordenacaoAtual.set({ campo: this.filtro.ordenarPor, direcao: this.filtro.direcao });
      }
      this.carregar(estado.pagina);
    } else {
      this.carregar();
    }
  }

  private salvarEstado(pagina: number) {
    this.comprasService.estadoLista = {
      filtro: { ...this.filtro },
      pagina,
      tamanhoPagina: this.tamanhoPagina()
    };
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.salvarEstado(pagina);
    this.comprasService.listarSugestoes({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as sugestões de compra.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.filtro.idMarca = this.marcaSelecionada?.id;
    this.filtro.idFornecedor = this.fornecedorSelecionado?.id;
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = {};
    this.marcaSelecionada = null;
    this.fornecedorSelecionado = null;
    this.ordenacaoAtual.set(null);
    this.carregar(1);
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.filtro.ordenarPor = ordenacao.campo;
    this.filtro.direcao = ordenacao.direcao;
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  abrirProduto(item: SugestaoCompra) {
    this.router.navigate(['/produtos', item.idProduto]);
  }

  rotuloCaixa(item: SugestaoCompra): string {
    if (!item.quantidadePorCaixa || item.quantidadePorCaixa <= 1) return '-';
    return `cx c/ ${item.quantidadePorCaixa}`;
  }

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarNumero(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR');
  }
}
