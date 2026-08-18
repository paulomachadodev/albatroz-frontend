import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContatosService, Contato, TipoContato } from '../../services/contatos.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ToggleComponent } from '../../../../../shared/components/toggle/toggle.component';

type ModoDrawer = 'criar' | 'editar';

const TODOS_TIPOS: TipoContato[] = ['Cliente', 'Fornecedor', 'Transportador', 'Portador', 'Outro'];

@Component({
  selector: 'app-contatos-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ListagemPaginadaComponent, DrawerComponent, PageHeaderComponent, ToggleComponent],
  templateUrl: './contatos-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContatosListaComponent implements OnInit {
  readonly todosTipos = TODOS_TIPOS;

  carregando = signal(true);
  itens = signal<Contato[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);

  filtroTexto = '';
  filtroTipo: TipoContato | '' = '';

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  contatoEmEdicao = signal<Contato | null>(null);
  salvando = signal(false);

  nome = '';
  fantasia = '';
  cpfCnpj = '';
  email = '';
  telefone = '';
  celular = '';
  ativo = true;
  tiposSelecionados = new Set<TipoContato>();

  constructor(
    private contatosService: ContatosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.contatosService.listar(
      { pagina, tamanho: this.tamanhoPagina() },
      { texto: this.filtroTexto || undefined, tipo: this.filtroTipo || undefined }
    ).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os contatos.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtroTexto = '';
    this.filtroTipo = '';
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
    this.contatoEmEdicao.set(null);
    this.nome = '';
    this.fantasia = '';
    this.cpfCnpj = '';
    this.email = '';
    this.telefone = '';
    this.celular = '';
    this.ativo = true;
    this.tiposSelecionados = new Set();
    this.drawerAberto.set(true);
  }

  abrirEditar(contato: Contato) {
    this.modoDrawer.set('editar');
    this.contatoEmEdicao.set(contato);
    this.nome = contato.nome;
    this.fantasia = contato.fantasia ?? '';
    this.cpfCnpj = contato.cpfCnpj ?? '';
    this.email = contato.email ?? '';
    this.telefone = contato.telefone ?? '';
    this.celular = contato.celular ?? '';
    this.ativo = contato.ativo;
    this.tiposSelecionados = new Set(contato.tipos);
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

  aoAlternarTipo(tipo: TipoContato, marcado: boolean) {
    if (marcado) this.tiposSelecionados.add(tipo);
    else this.tiposSelecionados.delete(tipo);
  }

  salvar() {
    const nome = this.nome.trim();
    if (!nome) {
      this.toast.erro('Nome é obrigatório.');
      return;
    }
    if (this.tiposSelecionados.size === 0) {
      this.toast.erro('Selecione ao menos um tipo.');
      return;
    }

    this.salvando.set(true);
    const payload = {
      nome,
      fantasia: this.fantasia.trim() || null,
      cpfCnpj: this.cpfCnpj.trim() || null,
      email: this.email.trim() || null,
      telefone: this.telefone.trim() || null,
      celular: this.celular.trim() || null,
      ativo: this.ativo,
      tipos: Array.from(this.tiposSelecionados)
    };

    const aoConcluir = () => {
      this.salvando.set(false);
      this.toast.sucesso(this.modoDrawer() === 'criar' ? 'Contato criado.' : 'Contato atualizado.');
      this.fecharDrawer();
      this.carregar(this.paginaAtual());
    };
    const aoFalhar = (err: unknown) => {
      this.salvando.set(false);
      this.toast.erroServidor(err, 'Não foi possível salvar o contato.');
    };

    if (this.modoDrawer() === 'criar') {
      this.contatosService.criar(payload).subscribe({ next: aoConcluir, error: aoFalhar });
    } else {
      this.contatosService.atualizar(this.contatoEmEdicao()!.id, payload).subscribe({ next: aoConcluir, error: aoFalhar });
    }
  }
}
