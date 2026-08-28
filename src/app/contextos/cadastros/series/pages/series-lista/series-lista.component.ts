import { Component, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { SeriesService } from '../../services/series.service';
import { Serie } from '../../models/serie.model';
import { EscolasService } from '../../../escolas/services/escolas.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ToggleComponent } from '../../../../../shared/components/toggle/toggle.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../../shared/components/select-busca/select-busca.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../../shared/components/th-ordenavel/th-ordenavel.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-series-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, ListagemPaginadaComponent, DrawerComponent, PageHeaderComponent, ToggleComponent, SelectBuscaComponent, ThOrdenavelComponent],
  templateUrl: './series-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class SeriesListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<Serie[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtroNome = '';
  filtroEscola = signal<OpcaoSelectBusca | null>(null);
  filtroAtivo = '';

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  serieEmEdicao = signal<Serie | null>(null);
  salvando = signal(false);

  escolaSelecionada = signal<OpcaoSelectBusca | null>(null);
  nome = '';
  ativo = true;

  constructor(
    private seriesService: SeriesService,
    private escolasService: EscolasService,
    private toast: ToastService
  ) {}

  buscarEscolas = (termo: string) => this.escolasService.buscar(termo).pipe(
    map(res => res.dados ?? [])
  );

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.seriesService.listar(pagina, this.tamanhoPagina(), {
      nome: this.filtroNome || undefined,
      escolaId: this.filtroEscola()?.id,
      ativo: this.filtroAtivo === '' ? undefined : this.filtroAtivo === 'true',
      ordenarPor: this.ordenacaoAtual()?.campo, direcao: this.ordenacaoAtual()?.direcao
    }).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as séries.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtroNome = '';
    this.filtroEscola.set(null);
    this.filtroAtivo = '';
    this.ordenacaoAtual.set(null);
    this.carregar(1);
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.carregar(1);
  }

  aoSelecionarFiltroEscola(opcao: OpcaoSelectBusca | null) {
    this.filtroEscola.set(opcao);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  abrirCriar() {
    this.modoDrawer.set('criar');
    this.serieEmEdicao.set(null);
    this.escolaSelecionada.set(null);
    this.nome = '';
    this.ativo = true;
    this.drawerAberto.set(true);
  }

  abrirEditar(serie: Serie) {
    this.modoDrawer.set('editar');
    this.serieEmEdicao.set(serie);
    this.escolaSelecionada.set({ id: serie.escolaId, nome: serie.escolaNome });
    this.nome = serie.nome;
    this.ativo = serie.ativo;
    this.drawerAberto.set(true);
  }

  fecharDrawer() {
    this.drawerAberto.set(false);
  }

  cancelar() {
    this.fecharDrawer();
  }

  aoSelecionarEscola(opcao: OpcaoSelectBusca | null) {
    this.escolaSelecionada.set(opcao);
  }

  aoAlternarAtivo(valor: boolean) {
    this.ativo = valor;
  }

  salvar() {
    const nome = this.nome.trim();
    if (!nome) {
      this.toast.erro('Nome da série é obrigatório.');
      return;
    }

    if (this.modoDrawer() === 'criar') {
      const escola = this.escolaSelecionada();
      if (!escola) {
        this.toast.erro('Selecione a escola.');
        return;
      }

      this.salvando.set(true);
      this.seriesService.criar({ escolaId: escola.id, nome }).subscribe({
        next: () => {
          this.salvando.set(false);
          this.toast.sucesso('Série criada.');
          this.fecharDrawer();
          this.carregar(this.paginaAtual());
        },
        error: err => {
          this.salvando.set(false);
          this.toast.erroServidor(err, 'Não foi possível criar a série.');
        }
      });
      return;
    }

    this.salvando.set(true);
    this.seriesService.atualizar(this.serieEmEdicao()!.id, { nome, ativo: this.ativo }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Série atualizada.');
        this.fecharDrawer();
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível atualizar a série.');
      }
    });
  }
}
