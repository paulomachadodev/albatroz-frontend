import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ProdutosService, ProdutoFiltro } from '../../services/produtos.service';
import { ProdutoResumo } from '../../models/produto.model';
import { AlterarProdutoEmMassaItemResposta } from '../../dtos/produto-resposta.dto';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { MenuDropdownComponent } from '../../../../shared/components/menu-dropdown/menu-dropdown.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

interface LinhaPlanilhaMassa {
  Codigo: string;
  Nome: string;
  Marca: string;
  Fornecedor: string;
}

@Component({
  selector: 'app-produtos-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ListagemPaginadaComponent, PageHeaderComponent, ThOrdenavelComponent, MenuDropdownComponent, ModalComponent],
  templateUrl: './produtos-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<ProdutoResumo[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtro: ProdutoFiltro = {};

  selecionados = new Map<number, ProdutoResumo>();
  qtdSelecionados = signal(0);

  modalMassaAberto = signal(false);
  processandoMassa = signal(false);
  resultadoMassa = signal<AlterarProdutoEmMassaItemResposta[] | null>(null);

  constructor(
    private produtosService: ProdutosService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private router: Router
  ) {}

  ngOnInit() {
    // Restaura filtro/página/ordenação da última visita à lista (ex.: usuário voltou da
    // tela de detalhe) em vez de resetar a busca do zero.
    const estado = this.produtosService.estadoLista;
    if (estado) {
      this.filtro = { ...estado.filtro };
      this.tamanhoPagina.set(estado.tamanhoPagina);
      if (this.filtro.ordenarPor && this.filtro.direcao) {
        this.ordenacaoAtual.set({ campo: this.filtro.ordenarPor, direcao: this.filtro.direcao });
      }
      this.carregar(estado.pagina);
    } else {
      this.carregar();
    }
  }

  private salvarEstado(pagina: number) {
    this.produtosService.estadoLista = {
      filtro: { ...this.filtro },
      pagina,
      tamanhoPagina: this.tamanhoPagina()
    };
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.salvarEstado(pagina);
    this.produtosService.listar({ pagina, tamanho: this.tamanhoPagina() }, this.filtro).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os produtos.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtro = {};
    this.ordenacaoAtual.set(null);
    this.carregar(1);
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.filtro.ordenarPor = ordenacao.campo;
    this.filtro.direcao = ordenacao.direcao;
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  abrirDetalhe(item: ProdutoResumo) {
    this.router.navigate(['/produtos', item.id]);
  }

  abrirDetalheAba(item: ProdutoResumo, aba: string) {
    this.router.navigate(['/produtos', item.id], { queryParams: { aba } });
  }

  irParaImportar() {
    this.router.navigate(['/produtos/importar-imagens']);
  }

  async migrarImagensTinyParaR2() {
    const confirmado = await this.confirm.confirmar(
      'Migrar imagens do Tiny pro R2?',
      'Processa em background TODOS os produtos ainda não migrados: recorta/converte cada imagem tiny e grava uma cópia origem=erp no R2, inativando a original. Pode demorar — acompanhe pelo Hangfire/Seq.',
      { textoConfirmar: 'Migrar' }
    );
    if (!confirmado) return;

    this.produtosService.migrarImagensTinyParaR2().subscribe({
      next: () => this.toast.sucesso('Migração iniciada em background.'),
      error: err => this.toast.erroServidor(err, 'Não foi possível iniciar a migração.')
    });
  }

  // ---- Seleção pra alteração em massa ----

  estaSelecionado(item: ProdutoResumo): boolean {
    return this.selecionados.has(item.id);
  }

  aoAlternarSelecao(item: ProdutoResumo, marcado: boolean) {
    if (marcado) this.selecionados.set(item.id, item);
    else this.selecionados.delete(item.id);
    this.qtdSelecionados.set(this.selecionados.size);
  }

  limparSelecao() {
    this.selecionados.clear();
    this.qtdSelecionados.set(0);
  }

  abrirAlterarEmMassa() {
    if (this.selecionados.size === 0) {
      this.toast.erro('Selecione ao menos um produto na listagem.');
      return;
    }
    this.resultadoMassa.set(null);
    this.modalMassaAberto.set(true);
  }

  fecharModalMassa() {
    this.modalMassaAberto.set(false);
  }

  baixarPlanilhaMassa() {
    const linhas: LinhaPlanilhaMassa[] = Array.from(this.selecionados.values()).map(item => ({
      Codigo: item.codigo,
      Nome: item.nome,
      Marca: item.marca ?? '',
      Fornecedor: ''
    }));
    const planilha = XLSX.utils.json_to_sheet(linhas);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, 'Produtos');
    XLSX.writeFile(livro, 'produtos-alterar-em-massa.xlsx');
  }

  aoSelecionarPlanilhaMassa(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    arquivo.arrayBuffer().then(buffer => {
      const livro = XLSX.read(buffer, { type: 'array' });
      const aba = livro.Sheets[livro.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json<LinhaPlanilhaMassa>(aba);

      const itens = linhas
        .filter(l => (l.Codigo ?? '').toString().trim().length > 0)
        .map(l => ({
          codigo: l.Codigo.toString().trim(),
          marca: l.Marca ? l.Marca.toString().trim() || null : null,
          fornecedor: l.Fornecedor ? l.Fornecedor.toString().trim() || null : null
        }));

      if (itens.length === 0) {
        this.toast.erro('Planilha vazia ou sem coluna Código.');
        input.value = '';
        return;
      }

      this.processandoMassa.set(true);
      this.produtosService.alterarEmMassa(itens).subscribe({
        next: res => {
          this.processandoMassa.set(false);
          this.resultadoMassa.set(res.dados?.itens ?? []);
          this.limparSelecao();
          this.carregar(this.paginaAtual());
        },
        error: err => {
          this.processandoMassa.set(false);
          this.toast.erroServidor(err, 'Não foi possível processar a planilha.');
        }
      });

      input.value = '';
    });
  }

  rotuloTipo(tipo: string): string {
    const mapa: Record<string, string> = { simples: 'Simples', kit: 'Kit', variacao: 'Variação' };
    return mapa[tipo] ?? tipo;
  }

  classeTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      simples: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      kit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      variacao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    };
    return mapa[tipo] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  }

  rotuloSituacao(situacao: string): string {
    const mapa: Record<string, string> = { A: 'Ativo', I: 'Inativo', E: 'Excluído' };
    return mapa[situacao] ?? situacao;
  }

  classeSituacao(situacao: string): string {
    const mapa: Record<string, string> = {
      A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      I: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      E: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
    };
    return mapa[situacao] ?? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  }

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarNumero(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR');
  }
}
