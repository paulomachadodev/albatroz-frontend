import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { SaudeEstoqueService } from '../../services/saude-estoque.service';
import { CorteGiroCritico, ProdutoSaudeEstoque, SaudeEstoque } from '../../models/saude-estoque.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

type ChaveSecao = 'semGiro' | 'candidatosParaComprar' | 'candidatosInativacao' | 'criticos';

interface SecaoSaudeEstoque {
  chave: ChaveSecao;
  titulo: string;
  descricao: string;
  icone: string;
  permiteInativar: boolean;
}

const SECOES: SecaoSaudeEstoque[] = [
  {
    chave: 'criticos',
    titulo: 'Críticos',
    descricao: 'Curva A com giro alto — não pode faltar, ponto de atenção pra não perder venda por ruptura.',
    icone: 'priority_high',
    permiteInativar: false
  },
  {
    chave: 'candidatosParaComprar',
    titulo: 'Candidatos a não repor',
    descricao: 'Sem venda há 90+ dias, mas ainda tem estoque — deixar vender o que tem antes de comprar mais.',
    icone: 'pause_circle',
    permiteInativar: true
  },
  {
    chave: 'semGiro',
    titulo: 'Sem giro',
    descricao: 'Sem venda há 90+ dias, com ou sem estoque.',
    icone: 'trending_down',
    permiteInativar: true
  },
  {
    chave: 'candidatosInativacao',
    titulo: 'Candidatos a inativação',
    descricao: 'Sem venda e sem estoque há 12 meses, ou nunca vendeu desde o cadastro há 12+ meses.',
    icone: 'delete_sweep',
    permiteInativar: true
  }
];

@Component({
  selector: 'app-saude-estoque',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, ModalComponent],
  templateUrl: './saude-estoque.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class SaudeEstoqueComponent implements OnInit {
  readonly secoes = SECOES;
  readonly opcoesCorteGiroCritico: CorteGiroCritico[] = [20, 40, 60];

  carregando = signal(true);
  dados = signal<SaudeEstoque | null>(null);
  corteGiroCritico = signal<CorteGiroCritico>(20);
  secoesExpandidas = signal<Set<ChaveSecao>>(new Set(SECOES.map(s => s.chave)));

  produtoParaInativar = signal<ProdutoSaudeEstoque | null>(null);
  secaoParaInativar = signal<ChaveSecao | null>(null);
  inativando = signal(false);

  constructor(
    private saudeEstoqueService: SaudeEstoqueService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.saudeEstoqueService.obterSaudeEstoque(this.corteGiroCritico()).subscribe({
      next: res => {
        this.dados.set(res.dados ?? null);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar a saúde de estoque.');
        this.carregando.set(false);
      }
    });
  }

  aoMudarCorte(corte: CorteGiroCritico) {
    if (this.corteGiroCritico() === corte) return;
    this.corteGiroCritico.set(corte);
    this.carregar();
  }

  itensDaSecao(chave: ChaveSecao): ProdutoSaudeEstoque[] {
    return this.dados()?.[chave] ?? [];
  }

  secaoExpandida(chave: ChaveSecao): boolean {
    return this.secoesExpandidas().has(chave);
  }

  alternarSecao(chave: ChaveSecao) {
    const novo = new Set(this.secoesExpandidas());
    if (novo.has(chave)) novo.delete(chave);
    else novo.add(chave);
    this.secoesExpandidas.set(novo);
  }

  abrirProduto(item: ProdutoSaudeEstoque) {
    this.router.navigate(['/produtos', item.idProduto], { queryParams: { origem: 'saude-estoque' } });
  }

  abrirConfirmacaoInativar(item: ProdutoSaudeEstoque, secao: ChaveSecao) {
    this.produtoParaInativar.set(item);
    this.secaoParaInativar.set(secao);
  }

  fecharConfirmacaoInativar() {
    if (this.inativando()) return;
    this.produtoParaInativar.set(null);
    this.secaoParaInativar.set(null);
  }

  confirmarInativar() {
    const produto = this.produtoParaInativar();
    const secao = this.secaoParaInativar();
    if (!produto || !secao) return;

    this.inativando.set(true);
    this.saudeEstoqueService.inativar(produto.idProduto).subscribe({
      next: () => {
        this.inativando.set(false);
        this.toast.sucesso('Produto inativado.', `${produto.nome} foi inativado no Albatroz e no Tiny.`);
        this.removerItemLocalmente(produto.idProduto);
        this.produtoParaInativar.set(null);
        this.secaoParaInativar.set(null);
      },
      error: err => {
        this.inativando.set(false);
        this.toast.erroServidor(err, 'Não foi possível inativar o produto.');
      }
    });
  }

  private removerItemLocalmente(idProduto: number) {
    const atual = this.dados();
    if (!atual) return;
    this.dados.set({
      semGiro: atual.semGiro.filter(i => i.idProduto !== idProduto),
      candidatosParaComprar: atual.candidatosParaComprar.filter(i => i.idProduto !== idProduto),
      candidatosInativacao: atual.candidatosInativacao.filter(i => i.idProduto !== idProduto),
      criticos: atual.criticos
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
