import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeNG } from 'primeng/config';
import { DatePickerModule } from 'primeng/datepicker';
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
  imports: [FormsModule, DatePickerModule, ListagemPaginadaComponent, PageHeaderComponent, ThOrdenavelComponent, SelectBuscaComponent, SelectBuscaMultiComponent, BreadcrumbComponent],
  providers: [PrimeNG],
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
  totalEstoque = signal(0);

  filtro: RelatorioVendaProdutosFiltro = {};
  marcasSelecionadas: OpcaoSelectBusca[] = [];
  fornecedorSelecionado: OpcaoSelectBusca | null = null;
  periodoPreset: '' | 'jan_mar' | 'ult90' | 'mes_atual' | 'personalizado' = 'ult90';
  intervaloDatas: Date[] | null = null;
  readonly calendarioPt = {
    root: { class: 'relative inline-flex w-full items-center' },
    pcInputText: { root: { class: 'w-full rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20' } },
    inputIconContainer: { class: 'absolute right-3 flex items-center text-slate-500' },
    panel: { class: 'z-50 rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100' },
    header: { class: 'flex items-center justify-between gap-3 pb-3 font-semibold' },
    pcPrevButton: { root: { class: 'rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800' } },
    pcNextButton: { root: { class: 'rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800' } },
    title: { class: 'flex items-center gap-2' },
    table: { class: 'w-full border-collapse text-center text-sm' },
    weekDay: { class: 'inline-flex h-9 w-9 items-center justify-center text-xs font-semibold text-slate-500' },
    day: { class: 'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&.p-datepicker-day-selected]:bg-primary [&.p-datepicker-day-selected]:text-white [&.p-datepicker-day-selected-range]:bg-primary/20' }
  };

  buscarMarcas = (termo: string) => this.marcasService.buscar(termo);
  buscarFornecedores = (termo: string) => this.contatosService.buscar(termo, 'Fornecedor');

  constructor(
    private vendasService: VendasService,
    private marcasService: MarcasService,
    private contatosService: ContatosService,
    private toast: ToastService,
    primeNg: PrimeNG
  ) {
    primeNg.setConfig({ theme: 'none', translation: {
      firstDayOfWeek: 0,
      dayNames: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
      dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
      dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
      monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
      monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      today: 'Hoje', clear: 'Limpar', prevMonth: 'Mês anterior', nextMonth: 'Próximo mês', chooseDate: 'Escolher data'
    } });
  }

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
      const ano = hoje.getFullYear();
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
    if (preset === 'personalizado') {
      const inicio = this.dataLocal(this.filtro.dataInicio);
      const fim = this.dataLocal(this.filtro.dataFim);
      this.intervaloDatas = inicio && fim ? [inicio, fim] : null;
    } else {
      this.intervaloDatas = null;
      this.aplicarPresetDatas(preset);
    }
  }

  private dataLocal(valor?: string): Date | null {
    if (!valor) return null;
    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  aoMudarIntervalo(datas: (Date | null)[] | null): void {
    this.intervaloDatas = datas?.filter((data): data is Date => data instanceof Date && !Number.isNaN(data.getTime())) ?? null;
    this.filtro.dataInicio = this.intervaloDatas?.[0] ? this.formatarDataIso(this.intervaloDatas[0]) : undefined;
    this.filtro.dataFim = this.intervaloDatas?.[1] ? this.formatarDataIso(this.intervaloDatas[1]) : undefined;
  }

  private periodoValido(): boolean {
    if (this.periodoPreset !== 'personalizado' || (this.filtro.dataInicio && this.filtro.dataFim)) return true;
    this.toast.erro('Selecione as datas inicial e final do período.');
    return false;
  }

  carregar(pagina = 1) {
    if (!this.periodoValido()) return;
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
        this.totalEstoque.set(dados[0]?.totalEstoqueGeral ?? 0);
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
    this.intervaloDatas = null;
    this.ordenacaoAtual.set(null);
    this.itens.set([]);
    this.totalRegistros.set(0);
    this.totalQuantidade.set(0);
    this.totalValor.set(0);
    this.totalEstoque.set(0);
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
    if (!this.periodoValido()) return;
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
          'Estoque Atual': item.estoqueAtual,
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
