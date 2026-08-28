import { Component, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EscolasService } from '../../services/escolas.service';
import { Escola } from '../../models/escola.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ToggleComponent } from '../../../../../shared/components/toggle/toggle.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../../shared/components/th-ordenavel/th-ordenavel.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-escolas-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, ListagemPaginadaComponent, DrawerComponent, PageHeaderComponent, ToggleComponent, ThOrdenavelComponent],
  templateUrl: './escolas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EscolasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<Escola[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtroNome = '';

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  escolaEmEdicao = signal<Escola | null>(null);
  salvando = signal(false);

  nome = '';
  bairro = '';
  cidade = '';
  parceira = false;
  ativo = true;

  constructor(
    private escolasService: EscolasService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.escolasService.listar(
      pagina, this.tamanhoPagina(), this.filtroNome || undefined,
      this.ordenacaoAtual()?.campo, this.ordenacaoAtual()?.direcao
    ).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as escolas.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtroNome = '';
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
    this.escolaEmEdicao.set(null);
    this.nome = '';
    this.bairro = '';
    this.cidade = '';
    this.parceira = false;
    this.ativo = true;
    this.drawerAberto.set(true);
  }

  abrirEditar(escola: Escola) {
    this.modoDrawer.set('editar');
    this.escolaEmEdicao.set(escola);
    this.nome = escola.nome;
    this.bairro = escola.bairro ?? '';
    this.cidade = escola.cidade ?? '';
    this.parceira = escola.parceira;
    this.ativo = escola.ativo;
    this.drawerAberto.set(true);
  }

  fecharDrawer() {
    this.drawerAberto.set(false);
  }

  cancelar() {
    this.fecharDrawer();
  }

  aoAlternarParceira(valor: boolean) {
    this.parceira = valor;
  }

  aoAlternarAtivo(valor: boolean) {
    this.ativo = valor;
  }

  salvar() {
    const nome = this.nome.trim();
    if (!nome) {
      this.toast.erro('Nome da escola é obrigatório.');
      return;
    }

    this.salvando.set(true);
    const payload = {
      nome,
      bairro: this.bairro.trim() || undefined,
      cidade: this.cidade.trim() || undefined,
      parceira: this.parceira,
      ativo: this.ativo
    };

    const request = this.modoDrawer() === 'criar'
      ? this.escolasService.criar(payload)
      : this.escolasService.atualizar(this.escolaEmEdicao()!.id, payload);

    request.subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso(this.modoDrawer() === 'criar' ? 'Escola criada.' : 'Escola atualizada.');
        this.fecharDrawer();
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar a escola.');
      }
    });
  }
}
