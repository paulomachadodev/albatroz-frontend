import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import * as XLSX from 'xlsx';
import { ContagemEstoqueService } from '../../services/contagem-estoque.service';
import { FiltroPrioridadeContagem, OrdenacaoPrioridadeContagem, ProdutoPrioridadeContagem } from '../../models/contagem-estoque.model';
import { montarGruposCategoriaSelect, PT_SELECT_CATEGORIA } from '../../utils/categoria-select.util';
import { PT_TOGGLE_SELECIONAR } from '../../utils/pt-toggle-selecionar.util';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { MarcasService } from '../../../produtos/services/marcas.service';
import { exportarPlanilha } from '../../../../shared/utils/exportar-planilha';

interface LinhaPlanilhaContagem {
  Codigo: string;
  CodigoBarras: string;
  Descricao: string;
  EstoqueSistema: number;
  'EstoqueContado (preencher)': string | number;
}

interface LinhaImportada {
  Codigo?: string | number;
  EstoqueSistema?: string | number;
  'EstoqueContado (preencher)'?: string | number;
  EstoqueContado?: string | number;
}

@Component({
  selector: 'app-contagem-estoque',
  standalone: true,
  imports: [FormsModule, RouterLink, ToggleSwitchModule, SelectModule, PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent, ThOrdenavelComponent, SelectBuscaComponent],
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
  ordenacaoAtual = signal<OrdenacaoPrioridadeContagem | null>(null);

  filtro: FiltroPrioridadeContagem = { situacao: 'A', comEstoque: true };
  marcaFiltro = signal<OpcaoSelectBusca | null>(null);
  buscarMarcas = (termo: string) => this.marcasService.buscar(termo);

  gruposCategoriaSelect = signal<ReturnType<typeof montarGruposCategoriaSelect>>([]);
  readonly ptSelectCategoria = PT_SELECT_CATEGORIA;

  selecionados = new Map<number, ProdutoPrioridadeContagem>();
  qtdSelecionados = signal(0);
  readonly ptToggleTodos = PT_TOGGLE_SELECIONAR;

  importando = signal(false);

  constructor(
    private contagemService: ContagemEstoqueService,
    private marcasService: MarcasService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregar(1);
    this.carregarCategorias();
  }

  private carregarCategorias() {
    this.contagemService.listarCategorias().subscribe({
      next: res => this.gruposCategoriaSelect.set(montarGruposCategoriaSelect(res.dados ?? [])),
      error: () => this.gruposCategoriaSelect.set([])
    });
  }

  carregar(pagina: number) {
    this.carregando.set(true);
    const filtroAtual: FiltroPrioridadeContagem = { ...this.filtro, idMarca: this.marcaFiltro()?.id };
    this.contagemService.listarPrioritarios({ pagina, tamanho: this.tamanhoPagina() }, filtroAtual, this.ordenacaoAtual()).subscribe({
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

  aoOrdenar(ordenacao: OrdenacaoPrioridadeContagem) {
    this.ordenacaoAtual.set(ordenacao);
    this.carregar(1);
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = { situacao: 'A', comEstoque: true };
    this.marcaFiltro.set(null);
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

  exportarSelecionados() {
    if (this.selecionados.size === 0) {
      this.toast.erro('Selecione ao menos um produto pra exportar.');
      return;
    }
    const base = Array.from(this.selecionados.values());

    const linhas: LinhaPlanilhaContagem[] = base.map(item => ({
      Codigo: item.codigo,
      CodigoBarras: item.gtin ?? '',
      Descricao: item.nome,
      EstoqueSistema: item.estoqueAtual,
      'EstoqueContado (preencher)': ''
    }));

    const carimbo = formatDate(new Date(), 'yyyyMMdd_HHmm', 'pt-BR', 'America/Sao_Paulo');
    const larguras = [12, 18, 45, 16, 24];
    exportarPlanilha(linhas, `contagem-estoque_${carimbo}`, 'Contagem', 'xlsx', larguras);
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
        .map(l => {
          const valorContado = l['EstoqueContado (preencher)'] ?? l.EstoqueContado;
          const foiPreenchido = valorContado !== undefined && valorContado !== null && String(valorContado).trim() !== '';
          return {
            codigo: (l.Codigo ?? '').toString().trim(),
            foiPreenchido,
            quantidadeContada: foiPreenchido ? Number(valorContado) : NaN,
            quantidadeSistemaExportacao: l.EstoqueSistema !== undefined && l.EstoqueSistema !== '' && !Number.isNaN(Number(l.EstoqueSistema))
              ? Number(l.EstoqueSistema)
              : null
          };
        })
        .filter(i => i.codigo.length > 0 && i.foiPreenchido && !Number.isNaN(i.quantidadeContada))
        .map(({ codigo, quantidadeContada, quantidadeSistemaExportacao }) => ({ codigo, quantidadeContada, quantidadeSistemaExportacao }));

      input.value = '';

      if (itensImportacao.length === 0) {
        this.toast.erro('Planilha vazia ou sem coluna de código/contagem preenchida.');
        return;
      }

      this.importando.set(true);
      this.contagemService.importarPreview(itensImportacao).subscribe({
        next: res => {
          this.importando.set(false);
          this.contagemService.previewPendente = res.dados ?? null;
          this.router.navigate(['/estoque/contagem/revisao']);
        },
        error: err => {
          this.importando.set(false);
          this.toast.erroServidor(err, 'Não foi possível processar a planilha.');
        }
      });
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
