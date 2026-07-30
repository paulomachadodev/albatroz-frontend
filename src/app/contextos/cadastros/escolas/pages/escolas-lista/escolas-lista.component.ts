import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EscolasService } from '../../services/escolas.service';
import { Escola } from '../../models/escola.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-escolas-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ListagemPaginadaComponent, DrawerComponent],
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

  filtroNome = '';

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  escolaEmEdicao = signal<Escola | null>(null);

  nome = '';
  bairro = '';
  cidade = '';
  parceira = false;

  private debounceNome?: ReturnType<typeof setTimeout>;
  private debounceBairro?: ReturnType<typeof setTimeout>;
  private debounceCidade?: ReturnType<typeof setTimeout>;

  constructor(
    private escolasService: EscolasService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.escolasService.listar(pagina, this.tamanhoPagina(), this.filtroNome || undefined).subscribe({
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
    this.drawerAberto.set(true);
  }

  abrirEditar(escola: Escola) {
    this.modoDrawer.set('editar');
    this.escolaEmEdicao.set(escola);
    this.nome = escola.nome;
    this.bairro = escola.bairro ?? '';
    this.cidade = escola.cidade ?? '';
    this.parceira = escola.parceira;
    this.drawerAberto.set(true);
  }

  private limparDebounces() {
    if (this.debounceNome) clearTimeout(this.debounceNome);
    if (this.debounceBairro) clearTimeout(this.debounceBairro);
    if (this.debounceCidade) clearTimeout(this.debounceCidade);
  }

  fecharDrawer() {
    this.limparDebounces();
    this.drawerAberto.set(false);
  }

  cancelar() {
    this.limparDebounces();
    this.fecharDrawer();
  }

  aoDigitarNome(valor: string) {
    this.nome = valor;
    if (this.debounceNome) clearTimeout(this.debounceNome);

    if (this.modoDrawer() === 'criar') {
      this.debounceNome = setTimeout(() => {
        const nome = this.nome.trim();
        if (!nome) return;
        this.escolasService.criar({ nome }).subscribe({
          next: res => {
            if (res.dados) {
              this.escolaEmEdicao.set(res.dados);
              this.modoDrawer.set('editar');
              this.toast.sucesso('Escola criada.');
              this.carregar(this.paginaAtual());
            }
          },
          error: err => this.toast.erroServidor(err, 'Não foi possível criar a escola.')
        });
      }, 700);
      return;
    }

    this.debounceNome = setTimeout(() => {
      const escola = this.escolaEmEdicao();
      const nome = this.nome.trim();
      if (!escola || !nome) return;
      this.escolasService.atualizar(escola.id, { nome }).subscribe({
        next: () => this.carregar(this.paginaAtual()),
        error: err => this.toast.erroServidor(err, 'Não foi possível salvar o nome.')
      });
    }, 700);
  }

  aoDigitarBairro(valor: string) {
    this.bairro = valor;
    if (this.modoDrawer() !== 'editar') return;
    if (this.debounceBairro) clearTimeout(this.debounceBairro);

    this.debounceBairro = setTimeout(() => {
      const escola = this.escolaEmEdicao();
      if (!escola) return;
      this.escolasService.atualizar(escola.id, { bairro: this.bairro.trim() }).subscribe({
        next: () => this.carregar(this.paginaAtual()),
        error: err => this.toast.erroServidor(err, 'Não foi possível salvar o bairro.')
      });
    }, 700);
  }

  aoDigitarCidade(valor: string) {
    this.cidade = valor;
    if (this.modoDrawer() !== 'editar') return;
    if (this.debounceCidade) clearTimeout(this.debounceCidade);

    this.debounceCidade = setTimeout(() => {
      const escola = this.escolaEmEdicao();
      if (!escola) return;
      this.escolasService.atualizar(escola.id, { cidade: this.cidade.trim() }).subscribe({
        next: () => this.carregar(this.paginaAtual()),
        error: err => this.toast.erroServidor(err, 'Não foi possível salvar a cidade.')
      });
    }, 700);
  }

  aoAlternarParceira(valor: boolean) {
    this.parceira = valor;
    const escola = this.escolaEmEdicao();
    if (this.modoDrawer() !== 'editar' || !escola) return;

    this.escolasService.atualizar(escola.id, { parceira: valor }).subscribe({
      next: () => this.carregar(this.paginaAtual()),
      error: err => this.toast.erroServidor(err, 'Não foi possível salvar.')
    });
  }
}
