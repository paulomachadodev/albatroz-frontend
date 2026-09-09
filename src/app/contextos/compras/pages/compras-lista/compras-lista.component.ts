import { Component, OnInit, signal, computed } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { exportarPlanilha } from '../../../../shared/utils/exportar-planilha';
import { ComprasService, SugestaoCompraFiltro, ComSugestaoFiltro } from '../../services/compras.service';
import { PedidosCompraService } from '../../services/pedidos-compra.service';
import { SugestaoCompra } from '../../models/sugestao-compra.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { SelectBuscaMultiComponent } from '../../../../shared/components/select-busca-multi/select-busca-multi.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ColunasConfiguraveisComponent, ColunaConfiguravel } from '../../../../shared/components/colunas-configuraveis/colunas-configuraveis.component';
import { MarcasService } from '../../../produtos/services/marcas.service';
import { ContatosService } from '../../../cadastros/contatos/services/contatos.service';

const PT_TOGGLE_SELECIONAR_TODOS = {
  root: 'inline-flex items-center cursor-pointer align-middle',
  input: 'absolute opacity-0 w-0 h-0',
  slider: ({ instance }: { instance: { checked(): boolean } }) =>
    'relative inline-block w-9 h-5 rounded-full transition-colors ' + (instance.checked() ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'),
  handle: ({ instance }: { instance: { checked(): boolean } }) =>
    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ' + (instance.checked() ? 'translate-x-4' : '')
};

const CHAVE_LOCALSTORAGE = 'compras-sugestoes-ajustadas-v1';
const CHAVE_LOCALSTORAGE_COLUNAS = 'compras-colunas-visiveis-v3';
const COLUNAS_VISIVEIS_PADRAO = ['cobertura', 'ultimaCompra', 'ultimaVenda'];

@Component({
  selector: 'app-compras-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, ToggleSwitchModule, ListagemPaginadaComponent, PageHeaderComponent, ThOrdenavelComponent, SelectBuscaComponent, SelectBuscaMultiComponent, ModalComponent, ColunasConfiguraveisComponent],
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
  aindaNaoFiltrado = signal(false);

  filtro: SugestaoCompraFiltro = {};
  marcasSelecionadas: OpcaoSelectBusca[] = [];
  fornecedorSelecionado: OpcaoSelectBusca | null = null;
  periodoPreset: '' | 'dez_mar' | 'personalizado' = '';

  buscarFornecedores = (termo: string) => this.contatosService.buscar(termo, 'Fornecedor');
  buscarMarcas = (termo: string) => this.marcasService.buscar(termo);

  readonly ptToggleTodos = PT_TOGGLE_SELECIONAR_TODOS;

  ajustesLocais = signal<Record<number, number>>(this.carregarAjustesLocais());

  colunasConfiguraveis: ColunaConfiguravel[] = [
    { chave: 'cobertura', rotulo: 'Cobertura' },
    { chave: 'marca', rotulo: 'Marca' },
    { chave: 'fornecedor', rotulo: 'Fornecedor' },
    { chave: 'ultimaCompra', rotulo: 'Última Compra' },
    { chave: 'ultimaVenda', rotulo: 'Última Venda' }
  ];
  colunasVisiveis = signal<Set<string>>(this.carregarColunasVisiveis());

  private totalEstimadoBase = signal(0);
  totalEstimadoGeral = computed(() => {
    const ajustes = this.ajustesLocais();
    const delta = this.itens().reduce((soma, item) => {
      const override = ajustes[item.idProduto];
      if (override == null) return soma;
      return soma + (override - (item.quantidadeAjustada ?? 0)) * (item.precoCusto ?? 0);
    }, 0);
    return this.totalEstimadoBase() + delta;
  });

  selecionados = new Map<number, SugestaoCompra>();
  qtdSelecionados = signal(0);
  selecionandoTodos = signal(false);
  modalPedidoAberto = signal(false);
  fornecedorPedido: OpcaoSelectBusca | null = null;
  observacoesPedido = '';
  gerandoPedido = signal(false);
  saldoAPagarFornecedorPedido = signal<number | null>(null);

  buscarFornecedoresPedido = (termo: string) => this.contatosService.buscar(termo, 'Fornecedor');

  exportando = signal(false);

  constructor(
    private comprasService: ComprasService,
    private pedidosCompraService: PedidosCompraService,
    private marcasService: MarcasService,
    private contatosService: ContatosService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const idFornecedor = params.get('idFornecedor');
    const fornecedorNome = params.get('fornecedorNome');
    if (idFornecedor && fornecedorNome) {
      this.fornecedorSelecionado = { id: Number(idFornecedor), nome: fornecedorNome };
      this.filtro.idFornecedor = Number(idFornecedor);
      this.carregar();
      return;
    }

    const estado = this.comprasService.estadoLista;
    if (estado) {
      this.filtro = { ...estado.filtro };
      this.tamanhoPagina.set(estado.tamanhoPagina);
      if (this.filtro.ordenarPor && this.filtro.direcao) {
        this.ordenacaoAtual.set({ campo: this.filtro.ordenarPor, direcao: this.filtro.direcao });
      }
      this.carregar(estado.pagina);
    } else {
      this.carregando.set(false);
      this.aindaNaoFiltrado.set(true);
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
    this.aindaNaoFiltrado.set(false);
    this.salvarEstado(pagina);
    this.comprasService.listarSugestoes({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.totalEstimadoBase.set(res.dados?.dados?.[0]?.valorTotalAjustadoGeral ?? 0);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as sugestões de compra.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.limparSelecao();
    this.filtro.idsMarca = this.marcasSelecionadas.length > 0 ? this.marcasSelecionadas.map(m => m.id) : undefined;
    this.filtro.idFornecedor = this.fornecedorSelecionado?.id;
    this.carregar(1);
  }

  limparFiltros() {
    this.limparSelecao();
    this.filtro = {};
    this.marcasSelecionadas = [];
    this.fornecedorSelecionado = null;
    this.periodoPreset = '';
    this.ordenacaoAtual.set(null);
    this.itens.set([]);
    this.totalRegistros.set(0);
    this.totalEstimadoBase.set(0);
    this.paginaAtual.set(1);
    this.totalPaginas.set(1);
    this.comprasService.estadoLista = undefined;
    this.aindaNaoFiltrado.set(true);
  }

  aoMudarComSugestao(valor: string) {
    this.filtro.comSugestao = (valor || undefined) as ComSugestaoFiltro | undefined;
  }

  aoMudarPreset(preset: '' | 'dez_mar' | 'personalizado') {
    this.periodoPreset = preset;
    if (preset === 'dez_mar') {
      const hoje = new Date();
      const anoFim = hoje.getMonth() >= 3 ? hoje.getFullYear() : hoje.getFullYear() - 1;
      this.filtro.dataInicio = `${anoFim - 1}-12-01`;
      this.filtro.dataFim = `${anoFim}-03-31`;
    } else if (preset === '') {
      this.filtro.dataInicio = undefined;
      this.filtro.dataFim = undefined;
    }
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

  abrirProduto(item: SugestaoCompra) {
    this.router.navigate(['/produtos', item.idProduto], { queryParams: { origem: 'compras' } });
  }

  private carregarAjustesLocais(): Record<number, number> {
    try {
      const bruto = localStorage.getItem(CHAVE_LOCALSTORAGE);
      return bruto ? JSON.parse(bruto) : {};
    } catch {
      return {};
    }
  }

  private salvarAjustesLocais(valores: Record<number, number>) {
    this.ajustesLocais.set(valores);
    try { localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(valores)); } catch { }
  }

  private carregarColunasVisiveis(): Set<string> {
    try {
      const bruto = localStorage.getItem(CHAVE_LOCALSTORAGE_COLUNAS);
      return bruto ? new Set(JSON.parse(bruto)) : new Set(COLUNAS_VISIVEIS_PADRAO);
    } catch {
      return new Set(COLUNAS_VISIVEIS_PADRAO);
    }
  }

  colunaVisivel(chave: string): boolean {
    return this.colunasVisiveis().has(chave);
  }

  aoAlternarColuna(evento: { chave: string; visivel: boolean }) {
    const novo = new Set(this.colunasVisiveis());
    if (evento.visivel) novo.add(evento.chave);
    else novo.delete(evento.chave);
    this.colunasVisiveis.set(novo);
    try { localStorage.setItem(CHAVE_LOCALSTORAGE_COLUNAS, JSON.stringify([...novo])); } catch { }
  }

  quantidadeEfetiva(item: SugestaoCompra): number {
    const ajustes = this.ajustesLocais();
    return ajustes[item.idProduto] ?? item.quantidadeAjustada ?? 0;
  }

  passoAjuste(item: SugestaoCompra): number {
    return item.quantidadePorCaixa && item.quantidadePorCaixa > 1 ? item.quantidadePorCaixa : 1;
  }

  ajustarSugestao(item: SugestaoCompra, delta: number) {
    const passo = this.passoAjuste(item);
    const atual = this.quantidadeEfetiva(item);
    const novo = Math.max(0, atual + delta * passo);
    const valores = { ...this.ajustesLocais(), [item.idProduto]: novo };
    this.salvarAjustesLocais(valores);
  }

  aoDigitarSugestao(item: SugestaoCompra, valor: string) {
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero < 0) return;
    const valores = { ...this.ajustesLocais(), [item.idProduto]: numero };
    this.salvarAjustesLocais(valores);
  }

  restaurarSugestao(item: SugestaoCompra) {
    const valores = { ...this.ajustesLocais() };
    delete valores[item.idProduto];
    this.salvarAjustesLocais(valores);
  }

  foiAjustado(item: SugestaoCompra): boolean {
    return this.ajustesLocais()[item.idProduto] != null;
  }

  rotuloColunaVendas(): string {
    if (this.periodoPreset === 'dez_mar') return 'Vendas (dez-mar)';
    if (this.periodoPreset === 'personalizado') return 'Vendas (período)';
    return 'Vendas (90d)';
  }

  rotuloCaixa(item: SugestaoCompra): string {
    if (!item.quantidadePorCaixa || item.quantidadePorCaixa <= 1) return '-';
    return String(item.quantidadePorCaixa);
  }

  estaSelecionado(item: SugestaoCompra): boolean {
    return this.selecionados.has(item.idProduto);
  }

  aoAlternarSelecao(item: SugestaoCompra, marcado: boolean) {
    if (marcado) this.selecionados.set(item.idProduto, item);
    else this.selecionados.delete(item.idProduto);
    this.qtdSelecionados.set(this.selecionados.size);
  }

  limparSelecao() {
    this.selecionados.clear();
    this.qtdSelecionados.set(0);
  }

  todosSelecionados(): boolean {
    return this.totalRegistros() > 0 && this.qtdSelecionados() === this.totalRegistros();
  }

  aoAlternarTodos(marcado: boolean) {
    if (!marcado) {
      this.limparSelecao();
      return;
    }
    this.selecionandoTodos.set(true);
    this.comprasService.exportarSugestoes(this.filtro).subscribe({
      next: res => {
        for (const item of res.dados ?? []) {
          this.selecionados.set(item.idProduto, item);
        }
        this.qtdSelecionados.set(this.selecionados.size);
        this.selecionandoTodos.set(false);
      },
      error: err => {
        this.selecionandoTodos.set(false);
        this.toast.erroServidor(err, 'Não foi possível selecionar todos os produtos do filtro.');
      }
    });
  }

  abrirGerarPedido() {
    if (this.selecionados.size === 0) {
      this.toast.erro('Selecione ao menos um produto na listagem.');
      return;
    }
    this.fornecedorPedido = null;
    this.observacoesPedido = '';
    this.saldoAPagarFornecedorPedido.set(null);
    this.modalPedidoAberto.set(true);
  }

  fecharModalPedido() {
    this.modalPedidoAberto.set(false);
  }

  aoSelecionarFornecedorPedido(opcao: OpcaoSelectBusca | null) {
    this.fornecedorPedido = opcao;
    this.saldoAPagarFornecedorPedido.set(null);
    if (!opcao) return;
    this.contatosService.obterSaldoAPagar(opcao.id).subscribe({
      next: res => this.saldoAPagarFornecedorPedido.set(res.dados ?? 0)
    });
  }

  confirmarGerarPedido() {
    if (!this.fornecedorPedido) {
      this.toast.erro('Selecione o fornecedor do pedido.');
      return;
    }

    const itens = Array.from(this.selecionados.values())
      .map(item => ({ idProduto: item.idProduto, quantidade: this.quantidadeEfetiva(item) }))
      .filter(i => i.quantidade > 0);

    if (itens.length === 0) {
      this.toast.erro('Os produtos selecionados estão com sugestão zerada — ajuste a quantidade antes de gerar o pedido.');
      return;
    }

    this.gerandoPedido.set(true);
    this.pedidosCompraService.criar({
      idFornecedor: this.fornecedorPedido.id,
      observacoes: this.observacoesPedido.trim() || null,
      itens
    }).subscribe({
      next: () => {
        this.gerandoPedido.set(false);
        this.toast.sucesso('Pedido de compra gerado.');
        this.fecharModalPedido();
        this.limparSelecao();
        this.router.navigate(['/compras/pedidos']);
      },
      error: err => {
        this.gerandoPedido.set(false);
        this.toast.erroServidor(err, 'Não foi possível gerar o pedido de compra.');
      }
    });
  }

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarNumero(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR');
  }

  formatarData(valor?: string): string {
    if (!valor) return '-';
    try {
      return formatDate(valor, 'dd/MM/yyyy', 'pt-BR', 'America/Sao_Paulo');
    } catch {
      return '-';
    }
  }

  exportarRelatorio(formato: 'xlsx' | 'csv') {
    this.exportando.set(true);
    this.comprasService.exportarSugestoes(this.filtro).subscribe({
      next: res => {
        this.exportando.set(false);
        const itens = res.dados ?? [];
        if (itens.length === 0) {
          this.toast.erro('Nenhum produto encontrado com os filtros atuais.');
          return;
        }
        const linhas = itens.map(item => ({
          'Código': item.codigo,
          'Produto': item.nome,
          'GTIN': item.gtin ?? '',
          'Marca': item.marca ?? '',
          'Fornecedor': item.fornecedor ?? '',
          'Curva ABC': item.curvaAbc ?? '',
          'Estoque Atual': item.estoqueAtual,
          'Preço Custo': item.precoCusto ?? 0,
          [this.rotuloColunaVendas()]: item.vendidoPeriodo ?? 0,
          'Qtd/Caixa': item.quantidadePorCaixa ?? '',
          'Sugestão (calc.)': item.sugestaoCompraQtd90d ?? 0,
          'Qtd a Comprar': this.quantidadeEfetiva(item),
          'Valor Total': this.quantidadeEfetiva(item) * (item.precoCusto ?? 0),
          'Cobertura c/ Compra (dias)': item.coberturaDiasComCompra ?? '',
          'Última Venda': this.formatarData(item.dataUltimaVenda),
          'Última Compra': this.formatarData(item.dataUltimaCompra),
          'Preço Última Compra': item.precoUltimaCompra ?? '',
          'Prazo Entrega Fornecedor': item.prazoEntregaDias ?? '',
          'Pedido Mínimo Fornecedor': item.valorPedidoMinimo ?? '',
          'Alerta Reposição Urgente': item.alertaReposicaoUrgente ? 'Sim' : 'Não',
          'Abaixo Pedido Mínimo': item.abaixoPedidoMinimo ? 'Sim' : 'Não'
        }));
        exportarPlanilha(linhas, 'relatorio-compras', 'Sugestões', formato);
      },
      error: err => {
        this.exportando.set(false);
        this.toast.erroServidor(err, 'Não foi possível exportar o relatório.');
      }
    });
  }
}
