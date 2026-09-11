import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SaudeEstoqueService } from '../../services/saude-estoque.service';
import { CategoriaSaudeEstoque, CorteGiroCritico, ProdutoSaudeEstoque } from '../../models/saude-estoque.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { exportarPlanilha } from '../../../../shared/utils/exportar-planilha';

interface ConfigCategoria {
  titulo: string;
  subtitulo: string;
  permiteSelecao: boolean;
}

const CONFIGS: Record<CategoriaSaudeEstoque, ConfigCategoria> = {
  'sem-giro': {
    titulo: 'Sem giro',
    subtitulo: 'Sem venda há 90+ dias, com ou sem estoque.',
    permiteSelecao: true
  },
  'candidatos-parar-comprar': {
    titulo: 'Candidatos a não repor',
    subtitulo: 'Sem venda há 90+ dias, mas ainda tem estoque — deixar vender o que tem antes de comprar mais.',
    permiteSelecao: true
  },
  'candidatos-inativacao': {
    titulo: 'Candidatos a inativação',
    subtitulo: 'Sem venda e sem estoque há 12 meses, ou nunca vendeu desde o cadastro há 12+ meses.',
    permiteSelecao: true
  },
  criticos: {
    titulo: 'Críticos',
    subtitulo: 'Curva A com giro alto — não pode faltar, ponto de atenção pra não perder venda por ruptura.',
    permiteSelecao: false
  }
};

@Component({
  selector: 'app-estoque-listagem',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent, ToggleComponent],
  templateUrl: './estoque-listagem.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EstoqueListagemComponent implements OnInit {
  readonly opcoesCorteGiroCritico: CorteGiroCritico[] = [20, 40, 60];

  categoria!: CategoriaSaudeEstoque;
  config!: ConfigCategoria;

  carregando = signal(true);
  itens = signal<ProdutoSaudeEstoque[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  corteGiroCritico = signal<CorteGiroCritico>(20);

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
    this.config = CONFIGS[this.categoria];
    this.carregar(1);
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    this.saudeEstoqueService
      .listar(this.categoria, { pagina, tamanho: this.tamanhoPagina() }, this.corteGiroCritico())
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
      Motivo: item.motivo ?? ''
    }));

    exportarPlanilha(linhas, `estoque-${this.categoria}`, 'Produtos');
    this.toast.sucesso('Planilha exportada.', `${linhas.length} produto(s) exportado(s).`);
  }

  formatarReais(valor: number | null): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarData(valor: string | null): string {
    if (!valor) return 'Nunca vendeu';
    try {
      return formatDate(valor, 'dd/MM/yyyy', 'pt-BR', 'America/Sao_Paulo');
    } catch {
      return '-';
    }
  }

  formatarPercentual(valor: number | null): string {
    if (valor == null) return '-';
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
}
