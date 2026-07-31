import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map, of } from 'rxjs';
import * as XLSX from 'xlsx';
import { ListasEscolaresService } from '../../services/listas-escolares.service';
import { EscolasService } from '../../../../cadastros/escolas/services/escolas.service';
import { ListaEscolarDetalhe, ListaEscolarItem, ProdutoBusca } from '../../models/lista-escolar.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../../shared/components/select-busca/select-busca.component';

@Component({
  selector: 'app-lista-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SelectBuscaComponent],
  templateUrl: './lista-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ListaDetalheComponent implements OnInit {
  idLista!: number;
  carregando = signal(true);
  lista = signal<ListaEscolarDetalhe | null>(null);
  liberandoLista = signal(false);
  reabrindoLista = signal(false);

  // busca de produto por item — indexado por idItem
  itemEmBusca = signal<number | null>(null);
  termoBusca = '';
  resultadosBusca = signal<ProdutoBusca[]>([]);
  buscandoProduto = signal(false);
  private debounce?: ReturnType<typeof setTimeout>;

  escolaSelecionada = signal<OpcaoSelectBusca | null>(null);
  serieSelecionada = signal<OpcaoSelectBusca | null>(null);
  salvandoEscolaSerie = signal(false);

  novoItem = { descricaoNaLista: '', quantidade: 1 };
  adicionandoItem = signal(false);

  todosItensResolvidos = computed(() => {
    const l = this.lista();
    if (!l || l.itens.length === 0) return false;
    return l.itens.every(i => i.liberado || i.statusItem === 'nao_encontrado');
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listasService: ListasEscolaresService,
    private escolasService: EscolasService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.idLista = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.listasService.obter(this.idLista).subscribe({
      next: res => {
        const dados = res.dados ?? null;
        this.lista.set(dados);
        if (dados) {
          this.escolaSelecionada.set(
            dados.idEscola ? { id: dados.idEscola, nome: dados.escolaNome ?? '' } : null);
          this.serieSelecionada.set(
            dados.idSerie ? { id: dados.idSerie, nome: dados.serie ?? '' } : null);
        }
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar a lista.');
        this.carregando.set(false);
      }
    });
  }

  /** Atualiza os dados sem passar por carregando() — evita esconder a tela e perder o scroll a cada ação num item. */
  private recarregarSilencioso() {
    this.listasService.obter(this.idLista).subscribe({
      next: res => this.lista.set(res.dados ?? null),
      error: err => this.toast.erroServidor(err, 'Não foi possível atualizar a lista.')
    });
  }

  buscarEscolas = (termo: string) =>
    this.escolasService.buscar(termo).pipe(map(res => res.dados ?? []));

  buscarSeries = (termo: string) => {
    const escolaId = this.escolaSelecionada()?.id;
    if (!escolaId) return of([] as OpcaoSelectBusca[]);
    return this.escolasService.buscarSeries(escolaId, termo).pipe(map(res => res.dados ?? []));
  };

  aoSelecionarEscola(opcao: OpcaoSelectBusca | null) {
    this.escolaSelecionada.set(opcao);
    this.serieSelecionada.set(null);
  }

  aoSelecionarSerie(opcao: OpcaoSelectBusca | null) {
    this.serieSelecionada.set(opcao);
  }

  salvarEscolaSerie() {
    this.salvandoEscolaSerie.set(true);
    this.listasService.atualizarLista(this.idLista, {
      idEscola: this.escolaSelecionada()?.id,
      idSerie: this.serieSelecionada()?.id
    }).subscribe({
      next: () => {
        this.salvandoEscolaSerie.set(false);
        this.toast.sucesso('Escola/série atualizada.');
        this.carregar();
      },
      error: err => {
        this.salvandoEscolaSerie.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar.');
      }
    });
  }

  cancelar() {
    this.router.navigate(['/cotacoes/listas-escolares']);
  }

  async liberarLista() {
    const confirmado = await this.confirm.confirmar(
      'Liberar essa lista?',
      'O orçamento passa a valer pra qualquer cliente que perguntar por ele, e quem já solicitou é notificado automaticamente.',
      { textoConfirmar: 'Liberar' }
    );
    if (!confirmado) return;

    this.liberandoLista.set(true);
    this.listasService.liberarLista(this.idLista).subscribe({
      next: () => {
        this.toast.info('Liberando lista...', 'Gerando o PDF em segundo plano — a tela atualiza sozinha quando terminar.');
        this.liberandoLista.set(false);
        this.carregar();
        this.aguardarLiberacao();
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível liberar a lista.');
        this.liberandoLista.set(false);
      }
    });
  }

  private aguardarLiberacao(tentativas = 0) {
    const MAX_TENTATIVAS = 40;
    setTimeout(() => {
      this.listasService.obter(this.idLista).subscribe({
        next: res => {
          const dados = res.dados ?? null;
          this.lista.set(dados);

          if (dados?.status === 'liberando' && tentativas < MAX_TENTATIVAS) {
            this.aguardarLiberacao(tentativas + 1);
            return;
          }

          if (dados?.status === 'liberada') {
            this.toast.sucesso('Lista liberada.', 'PDF gerado — contatos que já solicitaram serão notificados automaticamente.');
          } else if (dados?.status === 'liberando') {
            this.toast.erro('Liberação demorando demais', 'Ainda processando — atualize a página em alguns minutos pra conferir.');
          } else {
            this.toast.erro('Falha ao liberar', 'Não foi possível gerar o PDF do orçamento. Tente liberar de novo.');
          }
        },
        error: () => void 0
      });
    }, 3000);
  }

  editarLista() {
    this.reabrindoLista.set(true);
    this.listasService.reabrirEdicao(this.idLista).subscribe({
      next: () => {
        this.toast.sucesso('Lista reaberta pra edição — cliente só recebe de novo quando você liberar.');
        this.reabrindoLista.set(false);
        this.carregar();
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível reabrir a lista.');
        this.reabrindoLista.set(false);
      }
    });
  }

  exportarExcel() {
    const l = this.lista();
    if (!l) return;

    const linhas = l.itens.map(i => ({
      'Solicitado na lista': i.descricaoNaLista,
      'Marca': i.marcaNaLista ?? '',
      'SKU': i.codigoProduto ?? '',
      'Produto na loja': i.nomeProduto ?? '',
      'Qtd': i.quantidade,
      'Preço unit.': i.precoUnitario ?? 0,
      'Subtotal': i.subtotal ?? 0,
      'Status': i.statusItem,
      'Liberado': i.liberado ? 'Sim' : 'Não'
    }));

    const planilha = XLSX.utils.json_to_sheet(linhas);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, 'Itens');
    XLSX.writeFile(livro, `lista-escolar-${l.id}.xlsx`);
  }

  baixarPdf() {
    const url = this.lista()?.pdfCotacaoUrl;
    if (url) window.open(url, '_blank');
  }

  abrirBuscaProduto(item: ListaEscolarItem) {
    this.itemEmBusca.set(item.id);
    this.termoBusca = '';
    this.resultadosBusca.set([]);
  }

  fecharBuscaProduto() {
    this.itemEmBusca.set(null);
    this.resultadosBusca.set([]);
  }

  /** Chamado no (blur) do input de busca — atraso pra deixar o (mousedown) do item da lista disparar antes. */
  fecharBuscaProdutoComAtraso() {
    setTimeout(() => this.fecharBuscaProduto(), 150);
  }

  aoDigitarBusca(valor: string) {
    this.termoBusca = valor;
    if (this.debounce) clearTimeout(this.debounce);
    if (valor.trim().length < 2) { this.resultadosBusca.set([]); return; }

    this.debounce = setTimeout(() => {
      this.buscandoProduto.set(true);
      this.listasService.buscarProdutos(valor.trim()).subscribe({
        next: res => {
          this.resultadosBusca.set(res.dados ?? []);
          this.buscandoProduto.set(false);
        },
        error: () => this.buscandoProduto.set(false)
      });
    }, 300);
  }

  selecionarProduto(item: ListaEscolarItem, produto: ProdutoBusca) {
    this.listasService.atualizarItem(this.idLista, item.id, {
      idProduto: produto.id,
      quantidade: item.quantidade,
      naoVendemos: false
    }).subscribe({
      next: () => {
        this.toast.sucesso('Produto atualizado.');
        this.fecharBuscaProduto();
        this.recarregarSilencioso();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível trocar o produto.')
    });
  }

  alterarQuantidade(item: ListaEscolarItem, novaQtd: number) {
    if (!novaQtd || novaQtd < 1) return;
    this.listasService.atualizarItem(this.idLista, item.id, {
      quantidade: novaQtd,
      naoVendemos: false
    }).subscribe({
      next: () => this.recarregarSilencioso(),
      error: err => this.toast.erroServidor(err, 'Não foi possível ajustar a quantidade.')
    });
  }

  marcarNaoVendemos(item: ListaEscolarItem) {
    this.listasService.atualizarItem(this.idLista, item.id, {
      naoVendemos: true
    }).subscribe({
      next: () => {
        this.toast.sucesso('Item marcado como "não vendemos".');
        this.recarregarSilencioso();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível atualizar o item.')
    });
  }

  liberarItem(item: ListaEscolarItem) {
    this.listasService.liberarItem(this.idLista, item.id).subscribe({
      next: () => this.recarregarSilencioso(),
      error: err => this.toast.erroServidor(err, 'Não foi possível liberar o item.')
    });
  }

  desliberarItem(item: ListaEscolarItem) {
    this.listasService.desliberarItem(this.idLista, item.id).subscribe({
      next: () => this.recarregarSilencioso(),
      error: err => this.toast.erroServidor(err, 'Não foi possível desfazer a liberação do item.')
    });
  }

  async excluirItem(item: ListaEscolarItem) {
    const confirmado = await this.confirm.confirmar(
      `Excluir "${item.descricaoNaLista}" da lista?`,
      'Essa ação não pode ser desfeita.',
      { textoConfirmar: 'Excluir' }
    );
    if (!confirmado) return;

    this.listasService.excluirItem(this.idLista, item.id).subscribe({
      next: () => {
        this.toast.sucesso('Item excluído.');
        this.recarregarSilencioso();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível excluir o item.')
    });
  }

  adicionarItem() {
    if (!this.novoItem.descricaoNaLista.trim()) return;

    this.adicionandoItem.set(true);
    this.listasService.adicionarItem(this.idLista, this.novoItem).subscribe({
      next: () => {
        this.toast.sucesso('Item adicionado.');
        this.novoItem = { descricaoNaLista: '', quantidade: 1 };
        this.adicionandoItem.set(false);
        this.recarregarSilencioso();
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível adicionar o item.');
        this.adicionandoItem.set(false);
      }
    });
  }

  classeStatusItem(status: string): string {
    const mapa: Record<string, string> = {
      encontrado:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      nao_encontrado:      'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
      marca_substituida:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    };
    return mapa[status] ?? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }

  formatarReais(valor?: number): string {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
