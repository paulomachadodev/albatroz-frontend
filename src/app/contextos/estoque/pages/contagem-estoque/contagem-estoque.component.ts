import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import * as XLSX from 'xlsx';
import { ContagemEstoqueService } from '../../services/contagem-estoque.service';
import { PreviewContagem, ProdutoPrioridadeContagem } from '../../models/contagem-estoque.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { exportarPlanilha } from '../../../../shared/utils/exportar-planilha';

interface LinhaPlanilhaContagem {
  Codigo: string;
  Descricao: string;
  EstoqueSistema: number;
  'EstoqueContado (preencher)': string | number;
}

interface LinhaImportada {
  Codigo?: string | number;
  'EstoqueContado (preencher)'?: string | number;
  EstoqueContado?: string | number;
}

@Component({
  selector: 'app-contagem-estoque',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent, ToggleComponent, ModalComponent],
  templateUrl: './contagem-estoque.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContagemEstoqueComponent implements OnInit {
  carregando = signal(true);
  itens = signal<ProdutoPrioridadeContagem[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(20);

  selecionados = new Map<number, ProdutoPrioridadeContagem>();
  qtdSelecionados = signal(0);

  modalPreviewAberto = signal(false);
  preview = signal<PreviewContagem | null>(null);
  linhasIncluidas = new Set<number>();
  importando = signal(false);
  confirmando = signal(false);

  constructor(private contagemService: ContagemEstoqueService, private toast: ToastService) {}

  ngOnInit() {
    this.carregar(1);
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    this.contagemService.listarPrioritarios({ pagina, tamanho: this.tamanhoPagina() }).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar a lista de prioridade.');
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

  estaSelecionado(item: ProdutoPrioridadeContagem): boolean {
    return this.selecionados.has(item.idProduto);
  }

  aoAlternarSelecao(item: ProdutoPrioridadeContagem, marcado: boolean) {
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

  exportarPlanilhaDoDia() {
    const base = this.selecionados.size > 0 ? Array.from(this.selecionados.values()) : this.itens();
    if (base.length === 0) return;

    const linhas: LinhaPlanilhaContagem[] = base.map(item => ({
      Codigo: item.codigo,
      Descricao: item.nome,
      EstoqueSistema: item.estoqueAtual,
      'EstoqueContado (preencher)': ''
    }));

    exportarPlanilha(linhas, 'contagem-estoque', 'Contagem');
    this.toast.sucesso('Planilha exportada.', `${linhas.length} produto(s) na lista.`);
  }

  aoSelecionarPlanilhaImportar(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    arquivo.arrayBuffer().then(buffer => {
      let linhas: LinhaImportada[];
      try {
        const livro = XLSX.read(buffer, { type: 'array' });
        linhas = XLSX.utils.sheet_to_json<LinhaImportada>(livro.Sheets[livro.SheetNames[0]]);
      } catch {
        input.value = '';
        this.toast.erro('Não foi possível ler essa planilha. Confira se o arquivo não está corrompido ou protegido por senha.');
        return;
      }

      const itensImportacao = linhas
        .map(l => ({
          codigo: (l.Codigo ?? '').toString().trim(),
          quantidadeContada: Number(l['EstoqueContado (preencher)'] ?? l.EstoqueContado ?? '')
        }))
        .filter(i => i.codigo.length > 0 && !Number.isNaN(i.quantidadeContada));

      input.value = '';

      if (itensImportacao.length === 0) {
        this.toast.erro('Planilha vazia ou sem coluna de código/contagem preenchida.');
        return;
      }

      this.importando.set(true);
      this.contagemService.importarPreview(itensImportacao).subscribe({
        next: res => {
          this.importando.set(false);
          const dados = res.dados ?? null;
          this.preview.set(dados);
          this.linhasIncluidas = new Set(
            (dados?.itens ?? [])
              .map((item, indice) => ({ item, indice }))
              .filter(x => !x.item.erro)
              .map(x => x.indice)
          );
          this.modalPreviewAberto.set(true);
        },
        error: err => {
          this.importando.set(false);
          this.toast.erroServidor(err, 'Não foi possível processar a planilha.');
        }
      });
    });
  }

  linhaIncluida(indice: number): boolean {
    return this.linhasIncluidas.has(indice);
  }

  aoAlternarLinhaIncluida(indice: number, marcado: boolean) {
    if (marcado) this.linhasIncluidas.add(indice);
    else this.linhasIncluidas.delete(indice);
  }

  qtdIncluidas(): number {
    return this.linhasIncluidas.size;
  }

  fecharModalPreview() {
    this.modalPreviewAberto.set(false);
    this.preview.set(null);
    this.linhasIncluidas.clear();
  }

  confirmarAplicacao() {
    const itens = this.preview()?.itens ?? [];
    const selecionados = itens
      .map((item, indice) => ({ item, indice }))
      .filter(x => this.linhasIncluidas.has(x.indice) && x.item.idProduto !== null)
      .map(x => ({ idProduto: x.item.idProduto as number, quantidadeContada: x.item.quantidadeContada }));

    if (selecionados.length === 0) {
      this.toast.erro('Selecione ao menos um item pra aplicar.');
      return;
    }

    this.confirmando.set(true);
    this.contagemService.confirmar(selecionados).subscribe({
      next: res => {
        this.confirmando.set(false);
        this.toast.sucesso('Contagem aplicada.', `${res.dados?.produtosAtualizados ?? 0} produto(s) atualizado(s).`);
        this.fecharModalPreview();
        this.limparSelecao();
        this.carregar(1);
      },
      error: err => {
        this.confirmando.set(false);
        this.toast.erroServidor(err, 'Não foi possível aplicar a contagem.');
      }
    });
  }

  limparSelecao() {
    this.selecionados.clear();
    this.qtdSelecionados.set(0);
  }

  formatarDataHora(valor: string | null): string {
    if (!valor) return 'Nunca contado';
    try {
      return formatDate(valor, 'dd/MM/yyyy', 'pt-BR', 'America/Sao_Paulo');
    } catch {
      return '-';
    }
  }
}
