import { Component, OnInit, signal } from '@angular/core';
import { formatDate, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SaudeEstoqueService } from '../../services/saude-estoque.service';
import { CategoriaSaudeEstoque, CorteGiroCritico, JanelaRuptura, OrdenacaoSaudeEstoque, ProdutoSaudeEstoque } from '../../models/saude-estoque.model';
import { CONFIGS_SAUDE_ESTOQUE, ConfigCategoriaSaudeEstoque } from '../../config/saude-estoque-cards.config';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { exportarPlanilha } from '../../../../shared/utils/exportar-planilha';

@Component({
  selector: 'app-estoque-listagem',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent, ToggleComponent, ThOrdenavelComponent, NgTemplateOutlet],
  templateUrl: './estoque-listagem.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EstoqueListagemComponent implements OnInit {
  readonly opcoesCorteGiroCritico: CorteGiroCritico[] = [20, 40, 60];
  readonly opcoesJanelaRuptura: JanelaRuptura[] = [90, 120, 180];

  categoria!: CategoriaSaudeEstoque;
  config!: ConfigCategoriaSaudeEstoque;
  faixaAging = '';

  carregando = signal(true);
  itens = signal<ProdutoSaudeEstoque[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  corteGiroCritico = signal<CorteGiroCritico>(20);
  janelaRuptura = signal<JanelaRuptura>(90);
  ordenacaoAtual = signal<OrdenacaoSaudeEstoque | null>(null);

  selecionados = new Map<number, ProdutoSaudeEstoque>();
  qtdSelecionados = signal(0);

  constructor(
    private saudeEstoqueService: SaudeEstoqueService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.categoria = this.route.snapshot.data['categoria'];
    this.config = { ...CONFIGS_SAUDE_ESTOQUE[this.categoria] };

    if (this.categoria !== 'aging') {
      this.carregar(1);
      return;
    }

    this.route.paramMap.subscribe(params => {
      this.faixaAging = params.get('faixa') ?? '';
      this.config = {
        ...CONFIGS_SAUDE_ESTOQUE[this.categoria],
        descricao: `Produtos com estoque disponível, parados há ${this.faixaAging} dias sem venda.`
      };
      this.carregar(1);
    });
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    this.saudeEstoqueService
      .listar(this.categoria, { pagina, tamanho: this.tamanhoPagina() }, {
        corteGiroCritico: this.corteGiroCritico(),
        janelaDias: this.janelaRuptura(),
        faixaAging: this.faixaAging,
        ordenacao: this.ordenacaoAtual()
      })
      .subscribe({
        next: res => {
          this.itens.set(res.dados?.dados ?? []);
          this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
          this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
          this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
          this.carregando.set(false);
        },
        error: err => {
          this.toast.erroServidor(err, 'Não foi possível carregar a listagem.');
          this.carregando.set(false);
        }
      });
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  aoMudarCorte(corte: CorteGiroCritico) {
    if (this.corteGiroCritico() === corte) return;
    this.corteGiroCritico.set(corte);
    this.limparSelecao();
    this.carregar(1);
  }

  aoMudarJanelaRuptura(janela: JanelaRuptura) {
    if (this.janelaRuptura() === janela) return;
    this.janelaRuptura.set(janela);
    this.carregar(1);
  }

  aoOrdenar(ordenacao: OrdenacaoSaudeEstoque) {
    this.ordenacaoAtual.set(ordenacao);
    this.carregar(1);
  }

  abrirProduto(item: ProdutoSaudeEstoque) {
    this.router.navigate(['/produtos', item.idProduto], { queryParams: { origem: 'saude-estoque' } });
  }

  estaSelecionado(item: ProdutoSaudeEstoque): boolean {
    return this.selecionados.has(item.idProduto);
  }

  aoAlternarSelecao(item: ProdutoSaudeEstoque, marcado: boolean) {
    if (marcado) this.selecionados.set(item.idProduto, item);
    else this.selecionados.delete(item.idProduto);
    this.qtdSelecionados.set(this.selecionados.size);
  }

  todosDaPaginaSelecionados(): boolean {
    const pagina = this.itens();
    return pagina.length > 0 && pagina.every(item => this.selecionados.has(item.idProduto));
  }

  aoAlternarTodosDaPagina(marcado: boolean) {
    for (const item of this.itens()) {
      if (marcado) this.selecionados.set(item.idProduto, item);
      else this.selecionados.delete(item.idProduto);
    }
    this.qtdSelecionados.set(this.selecionados.size);
  }

  limparSelecao() {
    this.selecionados.clear();
    this.qtdSelecionados.set(0);
  }

  exportarSelecionados() {
    if (this.selecionados.size === 0) return;

    const linhas = Array.from(this.selecionados.values()).map(item => ({
      Codigo: item.codigo,
      Nome: item.nome,
      Marca: item.marca ?? '',
      EstoqueAtual: item.estoqueAtual,
      PrecoCusto: item.precoCusto ?? '',
      UltimaVenda: item.dataUltimaVenda ?? '',
      Motivo: item.motivo ?? '',
      DiasEstoque: item.diasEstoque ?? ''
    }));

    exportarPlanilha(linhas, `estoque-${this.categoria}`, 'Produtos');
    this.toast.sucesso('Planilha exportada.', `${linhas.length} produto(s) exportado(s).`);
  }

  formatarReais(valor: number | null): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarData(valor: string): string {
    try {
      return formatDate(valor, 'dd/MM/yyyy', 'pt-BR', 'America/Sao_Paulo');
    } catch {
      return '-';
    }
  }

  corteDiasEstoque(dias: number, meta: number): number {
    return Math.min((dias / (meta * 2)) * 100, 100);
  }

  corBarraDiasEstoque(dias: number, meta: number): string {
    if (this.categoria === 'criticos') {
      if (dias < meta * 0.7) return 'bg-rose-500';
      if (dias < meta) return 'bg-amber-500';
      return 'bg-emerald-500';
    }
    if (dias > meta) return 'bg-rose-500';
    if (dias >= meta * 0.7) return 'bg-emerald-500';
    return 'bg-amber-500';
  }

  formatarPercentual(valor: number | null): string {
    if (valor == null) return '-';
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
}
