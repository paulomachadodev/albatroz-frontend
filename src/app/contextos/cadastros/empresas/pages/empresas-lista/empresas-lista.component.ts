import { Component, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmpresasService } from '../../services/empresas.service';
import { Empresa } from '../../models/empresa.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ToggleComponent } from '../../../../../shared/components/toggle/toggle.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-empresas-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, ListagemPaginadaComponent, DrawerComponent, PageHeaderComponent, ToggleComponent],
  templateUrl: './empresas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EmpresasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<Empresa[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);

  filtroNome = '';

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  empresaEmEdicao = signal<Empresa | null>(null);
  salvando = signal(false);

  nome = '';
  cnpj = '';
  ativo = true;

  constructor(
    private empresasService: EmpresasService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.empresasService.listar(pagina, this.tamanhoPagina(), this.filtroNome || undefined).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as empresas.');
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
    this.empresaEmEdicao.set(null);
    this.nome = '';
    this.cnpj = '';
    this.ativo = true;
    this.drawerAberto.set(true);
  }

  abrirEditar(empresa: Empresa) {
    this.modoDrawer.set('editar');
    this.empresaEmEdicao.set(empresa);
    this.nome = empresa.nome;
    this.cnpj = empresa.cnpj ?? '';
    this.ativo = empresa.ativo;
    this.drawerAberto.set(true);
  }

  fecharDrawer() {
    this.drawerAberto.set(false);
  }

  cancelar() {
    this.fecharDrawer();
  }

  aoAlternarAtivo(valor: boolean) {
    this.ativo = valor;
  }

  salvar() {
    const nome = this.nome.trim();
    if (!nome) {
      this.toast.erro('Nome da empresa é obrigatório.');
      return;
    }

    this.salvando.set(true);
    const payload = {
      nome,
      cnpj: this.cnpj.trim() || undefined,
      ativo: this.ativo
    };

    const request = this.modoDrawer() === 'criar'
      ? this.empresasService.criar(payload)
      : this.empresasService.atualizar(this.empresaEmEdicao()!.id, payload);

    request.subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso(this.modoDrawer() === 'criar' ? 'Empresa criada.' : 'Empresa atualizada.');
        this.fecharDrawer();
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar a empresa.');
      }
    });
  }
}
