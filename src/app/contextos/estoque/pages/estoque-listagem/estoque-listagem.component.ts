import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SaudeEstoqueService } from '../../services/saude-estoque.service';
import { CategoriaSaudeEstoque, CorteGiroCritico, ProdutoSaudeEstoque } from '../../models/saude-estoque.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';

interface ConfigCategoria {
  titulo: string;
  subtitulo: string;
  permiteInativar: boolean;
}

const CONFIGS: Record<CategoriaSaudeEstoque, ConfigCategoria> = {
  'sem-giro': {
    titulo: 'Sem giro',
    subtitulo: 'Sem venda há 90+ dias, com ou sem estoque.',
    permiteInativar: true
  },
  'candidatos-parar-comprar': {
    titulo: 'Candidatos a não repor',
    subtitulo: 'Sem venda há 90+ dias, mas ainda tem estoque — deixar vender o que tem antes de comprar mais.',
    permiteInativar: true
  },
  'candidatos-inativacao': {
    titulo: 'Candidatos a inativação',
    subtitulo: 'Sem venda e sem estoque há 12 meses, ou nunca vendeu desde o cadastro há 12+ meses.',
    permiteInativar: true
  },
  criticos: {
    titulo: 'Críticos',
    subtitulo: 'Curva A com giro alto — não pode faltar, ponto de atenção pra não perder venda por ruptura.',
    permiteInativar: false
  }
};

@Component({
  selector: 'app-estoque-listagem',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, ModalComponent, ListagemPaginadaComponent, ToggleComponent],
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

  produtoParaInativar = signal<ProdutoSaudeEstoque | null>(null);
  modalLoteAberto = signal(false);
  inativando = signal(false);

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

  abrirConfirmacaoInativarIndividual(item: ProdutoSaudeEstoque) {
    this.produtoParaInativar.set(item);
  }

  fecharConfirmacaoInativarIndividual() {
    if (this.inativando()) return;
    this.produtoParaInativar.set(null);
  }

  confirmarInativarIndividual() {
    const produto = this.produtoParaInativar();
    if (!produto) return;

    this.inativando.set(true);
    this.saudeEstoqueService.inativar(produto.idProduto).subscribe({
      next: () => {
        this.inativando.set(false);
        this.toast.sucesso('Produto inativado.', `${produto.nome} foi inativado no Albatroz e no Tiny.`);
        this.produtoParaInativar.set(null);
        this.selecionados.delete(produto.idProduto);
        this.qtdSelecionados.set(this.selecionados.size);
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.inativando.set(false);
        this.toast.erroServidor(err, 'Não foi possível inativar o produto.');
      }
    });
  }

  abrirConfirmacaoInativarLote() {
    if (this.selecionados.size === 0) return;
    this.modalLoteAberto.set(true);
  }

  fecharConfirmacaoInativarLote() {
    if (this.inativando()) return;
    this.modalLoteAberto.set(false);
  }

  confirmarInativarLote() {
    const ids = Array.from(this.selecionados.keys());
    if (ids.length === 0) return;

    this.inativando.set(true);
    this.saudeEstoqueService.inativarLote(ids).subscribe({
      next: res => {
        this.inativando.set(false);
        this.modalLoteAberto.set(false);
        const resultado = res.dados;
        if (resultado && resultado.falharam.length > 0) {
          this.toast.erro(`${resultado.sucesso} inativado(s), ${resultado.falharam.length} falharam.`);
        } else {
          this.toast.sucesso('Produtos inativados.', `${resultado?.sucesso ?? ids.length} produto(s) inativado(s).`);
        }
        this.limparSelecao();
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.inativando.set(false);
        this.toast.erroServidor(err, 'Não foi possível inativar os produtos selecionados.');
      }
    });
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
