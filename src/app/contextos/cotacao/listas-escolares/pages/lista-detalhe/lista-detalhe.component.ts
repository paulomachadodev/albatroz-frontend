import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListasEscolaresService } from '../../services/listas-escolares.service';
import { ListaEscolarDetalhe, ListaEscolarItem, ProdutoBusca } from '../../models/lista-escolar.model';
import { ToastService } from '../../../../../core/feedback/toast.service';

@Component({
  selector: 'app-lista-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './lista-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ListaDetalheComponent implements OnInit {
  idLista!: number;
  carregando = signal(true);
  lista = signal<ListaEscolarDetalhe | null>(null);
  salvandoLista = signal(false);
  liberandoLista = signal(false);

  // busca de produto por item — indexado por idItem
  itemEmBusca = signal<number | null>(null);
  termoBusca = '';
  resultadosBusca = signal<ProdutoBusca[]>([]);
  buscandoProduto = signal(false);
  private debounce?: ReturnType<typeof setTimeout>;

  formLista = { escolaNome: '', turma: '', turno: '', serie: '' };

  constructor(
    private route: ActivatedRoute,
    private listasService: ListasEscolaresService,
    private toast: ToastService
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
          this.formLista = {
            escolaNome: dados.escolaNome ?? '',
            turma: dados.turma ?? '',
            turno: dados.turno ?? '',
            serie: dados.serie ?? ''
          };
        }
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar a lista.');
        this.carregando.set(false);
      }
    });
  }

  salvarLista() {
    this.salvandoLista.set(true);
    this.listasService.atualizarLista(this.idLista, this.formLista).subscribe({
      next: () => {
        this.toast.sucesso('Lista atualizada.');
        this.salvandoLista.set(false);
        this.carregar();
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível salvar.');
        this.salvandoLista.set(false);
      }
    });
  }

  liberarLista() {
    this.liberandoLista.set(true);
    this.listasService.liberarLista(this.idLista).subscribe({
      next: res => {
        const qtd = res.dados?.whatsappIdsParaNotificar?.length ?? 0;
        this.toast.sucesso(
          'Lista liberada.',
          qtd > 0
            ? `${qtd} contato(s) pediram essa lista — envio automático via WhatsApp ainda não implementado, avisar manualmente.`
            : undefined
        );
        this.liberandoLista.set(false);
        this.carregar();
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível liberar a lista.');
        this.liberandoLista.set(false);
      }
    });
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
        this.carregar();
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
      next: () => this.carregar(),
      error: err => this.toast.erroServidor(err, 'Não foi possível ajustar a quantidade.')
    });
  }

  marcarNaoVendemos(item: ListaEscolarItem) {
    this.listasService.atualizarItem(this.idLista, item.id, {
      naoVendemos: true
    }).subscribe({
      next: () => {
        this.toast.sucesso('Item marcado como "não vendemos".');
        this.carregar();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível atualizar o item.')
    });
  }

  liberarItem(item: ListaEscolarItem) {
    this.listasService.liberarItem(this.idLista, item.id).subscribe({
      next: () => this.carregar(),
      error: err => this.toast.erroServidor(err, 'Não foi possível liberar o item.')
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
