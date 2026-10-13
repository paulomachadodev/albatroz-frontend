import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { exportarPlanilha } from '../../../../shared/utils/exportar-planilha';
import { VendasService } from '../../services/vendas.service';
import { RelatorioVendaProduto, RelatorioVendaProdutosFiltro } from '../../models/relatorio-venda-produto.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { SelectBuscaMultiComponent } from '../../../../shared/components/select-busca-multi/select-busca-multi.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { MarcasService } from '../../../produtos/services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';

@Component({
  selector: 'app-relatorio-vendas-produtos',
  standalone: true,
  imports: [FormsModule, ListagemPaginadaComponent, PageHeaderComponent, ThOrdenavelComponent, SelectBuscaComponent, SelectBuscaMultiComponent, BreadcrumbComponent],
  templateUrl: './relatorio-vendas-produtos.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class RelatorioVendasProdutosComponent implements OnInit {
  carregando = signal(true);
  itens = signal<RelatorioVendaProduto[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);
  aindaNaoFiltrado = signal(true);
  exportando = signal(false);

  totalQuantidade = signal(0);
  totalValor = signal(0);

  filtro: RelatorioVendaProdutosFiltro = {};
  marcasSelecionadas: OpcaoSelectBusca[] = [];
  fornecedorSelecionado: OpcaoSelectBusca | null = null;
  periodoPreset: '' | 'jan_mar' | 'ult90' | 'mes_atual' | 'personalizado' = 'ult90';

  buscarMarcas = (termo: string) => this.marcasService.buscar(termo);
  buscarFornecedores = (termo: string) => this.contatosService.buscar(termo, 'Fornecedor');

  constructor(
    private vendasService: VendasService,
    private marcasService: MarcasService,
    private contatosService: ContatosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregando.set(false);
    this.aplicarPresetDatas('ult90');
  }

  private aplicarPresetDatas(preset: string) {
    const hoje = new Date();
    if (preset === 'ult90') {
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 90);
      this.filtro.dataInicio = this.formatarDataIso(inicio);
      this.filtro.dataFim = this.formatarDataIso(hoje);
    } else if (preset === 'jan_mar') {
      const ano = hoje.getMonth() >= 3 ? hoje.getFullYear() : hoje.getFullYear() - 1;
      this.filtro.dataInicio = `${ano}-01-01`;
      this.filtro.dataFim = `${ano}-03-31`;
    } else if (preset === 'mes_atual') {
      this.filtro.dataInicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
      this.filtro.dataFim = this.formatarDataIso(hoje);
    }
  }

  private formatarDataIso(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }

  aoMudarPreset(preset: '' | 'jan_mar' | 'ult90' | 'mes_atual' | 'personalizado') {
    this.periodoPreset = preset;
    if (preset !== 'personalizado') {
      this.aplicarPresetDatas(preset);
    }
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.aindaNaoFiltrado.set(false);
    this.vendasService.listarRelatorioProdutos({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        const dados = res.dados?.dados ?? [];
        this.itens.set(dados);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.totalQuantidade.set(dados[0]?.totalQuantidadeGeral ?? 0);
        this.totalValor.set(dados[0]?.totalValorGeral ?? 0);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o relatório de vendas.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.filtro.idsMarca = this.marcasSelecionadas.length > 0 ? this.marcasSelecionadas.map(m => m.id) : undefined;
    this.filtro.idFornecedor = this.fornecedorSelecionado?.id;
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = {};
    this.marcasSelecionadas = [];
    this.fornecedorSelecionado = null;
    this.periodoPreset = 'ult90';
    this.ordenacaoAtual.set(null);
    this.itens.set([]);
    this.totalRegistros.set(0);
    this.totalQuantidade.set(0);
    this.totalValor.set(0);
    this.paginaAtual.set(1);
    this.totalPaginas.set(1);
    this.aindaNaoFiltrado.set(true);
    this.aplicarPresetDatas('ult90');
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.filtro.ordenarPor = ordenacao.campo;
    this.filtro.direcao = ordenacao.direcao;
    if (this.aindaNaoFiltrado()) return;
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  exportarRelatorio(formato: 'xlsx' | 'csv') {
    this.exportando.set(true);
    this.vendasService.exportarRelatorioProdutos(this.filtro).subscribe({
      next: res => {
        this.exportando.set(false);
        const dados = res.dados ?? [];
        if (dados.length === 0) {
          this.toast.erro('Nenhum produto encontrado com os filtros atuais.');
          return;
        }
        const linhas = dados.map(item => ({
          'Código': item.sku,
          'Produto': item.descricao,
          'Marca': item.marca ?? '',
          'Fornecedor': item.fornecedor ?? '',
          'Qtd Vendida': item.quantidadeVendida,
          'Valor Médio': item.valorMedioVenda,
          'Valor Total': item.valorTotalVenda
        }));
        exportarPlanilha(linhas, 'relatorio-vendas-produtos', 'Vendas por Produto', formato);
      },
      error: err => {
        this.exportando.set(false);
        this.toast.erroServidor(err, 'Não foi possível exportar o relatório.');
      }
    });
  }

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarNumero(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
}
