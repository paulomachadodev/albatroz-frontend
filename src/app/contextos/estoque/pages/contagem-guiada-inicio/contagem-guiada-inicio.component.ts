import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ContagemEstoqueService } from '../../services/contagem-estoque.service';
import { ContagemSessaoService } from '../../services/contagem-sessao.service';
import { ContagemSessaoResumo, FiltroPrioridadeContagem, ProdutoPrioridadeContagem } from '../../models/contagem-estoque.model';
import { montarGruposCategoriaSelect, PT_SELECT_CATEGORIA } from '../../utils/categoria-select.util';
import { PT_TOGGLE_SELECIONAR } from '../../utils/pt-toggle-selecionar.util';
import { formatarDataHora } from '../../../../shared/utils/formatar-data-hora.util';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { MarcasService } from '../../../produtos/services/marcas.service';

type Fase = 'menu' | 'novaContagem' | 'filtrada';

@Component({
  selector: 'app-contagem-guiada-inicio',
  standalone: true,
  imports: [FormsModule, ToggleSwitchModule, SelectModule, PageHeaderComponent, BreadcrumbComponent, SelectBuscaComponent],
  templateUrl: './contagem-guiada-inicio.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContagemGuiadaInicioComponent implements OnInit {
  carregando = signal(true);
  sessoesAbertas = signal<ContagemSessaoResumo[]>([]);
  fase = signal<Fase>('menu');

  gruposCategoriaSelect = signal<ReturnType<typeof montarGruposCategoriaSelect>>([]);
  readonly ptSelectCategoria = PT_SELECT_CATEGORIA;
  readonly ptToggleSelecionar = PT_TOGGLE_SELECIONAR;

  filtro: FiltroPrioridadeContagem = { situacao: 'A', comEstoque: true };
  marcaFiltro = signal<OpcaoSelectBusca | null>(null);
  buscarMarcas = (termo: string) => this.marcasService.buscar(termo);
  filtrosExpandidos = signal(false);

  buscou = signal(false);
  buscando = signal(false);
  resultados = signal<ProdutoPrioridadeContagem[]>([]);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  totalRegistros = signal(0);

  selecionados = new Map<number, ProdutoPrioridadeContagem>();
  qtdSelecionados = signal(0);

  iniciando = signal(false);

  constructor(
    private contagemSessaoService: ContagemSessaoService,
    private contagemEstoqueService: ContagemEstoqueService,
    private marcasService: MarcasService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarSessoesAbertas();
    this.contagemEstoqueService.listarCategorias().subscribe({
      next: res => this.gruposCategoriaSelect.set(montarGruposCategoriaSelect(res.dados ?? [])),
      error: () => this.gruposCategoriaSelect.set([])
    });
  }

  carregarSessoesAbertas() {
    this.carregando.set(true);
    this.contagemSessaoService.listar().subscribe({
      next: res => {
        this.sessoesAbertas.set(res.dados ?? []);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar suas contagens em aberto.');
        this.carregando.set(false);
      }
    });
  }

  continuar(sessao: ContagemSessaoResumo) {
    this.router.navigate(['/estoque/contagem/guiada', sessao.id]);
  }

  irParaNovaContagem() {
    this.fase.set('novaContagem');
  }

  voltarParaMenu() {
    this.fase.set('menu');
  }

  iniciarPorPrioridade() {
    this.iniciando.set(true);
    this.contagemSessaoService.iniciar({ modo: 'prioridade' }).subscribe({
      next: res => {
        this.iniciando.set(false);
        if (res.dados) this.router.navigate(['/estoque/contagem/guiada', res.dados.id]);
      },
      error: err => {
        this.iniciando.set(false);
        this.toast.erroServidor(err, 'Não foi possível iniciar a contagem.');
      }
    });
  }

  irParaFiltrada() {
    this.fase.set('filtrada');
    this.buscou.set(false);
    this.resultados.set([]);
    this.selecionados.clear();
    this.qtdSelecionados.set(0);
  }

  voltarParaNovaContagem() {
    this.fase.set('novaContagem');
  }

  alternarFiltros() {
    this.filtrosExpandidos.update(v => !v);
  }

  buscarFiltrada(pagina = 1) {
    this.buscando.set(true);
    this.buscou.set(true);
    const filtroAtual: FiltroPrioridadeContagem = { ...this.filtro, idMarca: this.marcaFiltro()?.id };
    this.contagemEstoqueService.listarPrioritarios({ pagina, tamanho: 20 }, filtroAtual).subscribe({
      next: res => {
        this.resultados.set(res.dados?.dados ?? []);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.buscando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível buscar produtos.');
        this.buscando.set(false);
      }
    });
  }

  estaSelecionado(item: ProdutoPrioridadeContagem): boolean {
    return this.selecionados.has(item.idProduto);
  }

  aoAlternarSelecao(item: ProdutoPrioridadeContagem, marcado: boolean) {
    if (marcado) this.selecionados.set(item.idProduto, item);
    else this.selecionados.delete(item.idProduto);
    this.qtdSelecionados.set(this.selecionados.size);
  }

  iniciarComSelecao() {
    if (this.selecionados.size === 0) return;

    this.iniciando.set(true);
    this.contagemSessaoService.iniciar({ modo: 'selecao', idsProduto: Array.from(this.selecionados.keys()) }).subscribe({
      next: res => {
        this.iniciando.set(false);
        if (res.dados) this.router.navigate(['/estoque/contagem/guiada', res.dados.id]);
      },
      error: err => {
        this.iniciando.set(false);
        this.toast.erroServidor(err, 'Não foi possível iniciar a contagem.');
      }
    });
  }

  formatarDataHora = formatarDataHora;

  rotuloModo(modo: string): string {
    return modo === 'prioridade' ? 'Prioridade' : modo === 'categoria' ? 'Categoria' : modo === 'marca' ? 'Marca' : 'Filtrada';
  }

  rotuloStatus(status: string): string {
    return status === 'aberta' ? 'Em andamento' : status === 'emRevisao' ? 'Aguardando efetivação' : status;
  }
}
