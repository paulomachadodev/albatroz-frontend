import { Component, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarcasService, Marca } from '../../services/marcas.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../shared/components/th-ordenavel/th-ordenavel.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-marcas-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, ListagemPaginadaComponent, DrawerComponent, PageHeaderComponent, ToggleComponent, ThOrdenavelComponent],
  templateUrl: './marcas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class MarcasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<Marca[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtroTexto = '';

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  marcaEmEdicao = signal<Marca | null>(null);
  salvando = signal(false);

  nome = '';
  descricao = '';
  ativa = true;

  constructor(
    private marcasService: MarcasService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.marcasService.listar({ pagina, tamanho: this.tamanhoPagina() }, {
      texto: this.filtroTexto || undefined,
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
        this.toast.erroServidor(err, 'Não foi possível carregar as marcas.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtroTexto = '';
    this.ordenacaoAtual.set(null);
    this.carregar(1);
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.carregar(1);
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
    this.marcaEmEdicao.set(null);
    this.nome = '';
    this.descricao = '';
    this.ativa = true;
    this.drawerAberto.set(true);
  }

  abrirEditar(marca: Marca) {
    this.modoDrawer.set('editar');
    this.marcaEmEdicao.set(marca);
    this.nome = marca.nome;
    this.descricao = marca.descricao ?? '';
    this.ativa = marca.ativa;
    this.drawerAberto.set(true);
  }

  fecharDrawer() {
    this.drawerAberto.set(false);
  }

  cancelar() {
    this.fecharDrawer();
  }

  aoAlternarAtiva(valor: boolean) {
    this.ativa = valor;
  }

  salvar() {
    const nome = this.nome.trim();
    if (!nome) {
      this.toast.erro('Nome da marca é obrigatório.');
      return;
    }

    this.salvando.set(true);
    const payload = {
      nome,
      descricao: this.descricao.trim() || null,
      ativa: this.ativa
    };

    const aoConcluir = () => {
      this.salvando.set(false);
      this.toast.sucesso(this.modoDrawer() === 'criar' ? 'Marca criada.' : 'Marca atualizada.');
      this.fecharDrawer();
      this.carregar(this.paginaAtual());
    };
    const aoFalhar = (err: unknown) => {
      this.salvando.set(false);
      this.toast.erroServidor(err, 'Não foi possível salvar a marca.');
    };

    if (this.modoDrawer() === 'criar') {
      this.marcasService.criar(payload).subscribe({ next: aoConcluir, error: aoFalhar });
    } else {
      this.marcasService.atualizar(this.marcaEmEdicao()!.id, payload).subscribe({ next: aoConcluir, error: aoFalhar });
    }
  }
}
