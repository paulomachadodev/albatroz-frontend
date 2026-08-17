import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PerfisService } from '../../services/perfis.service';
import { Perfil, Permissao } from '../../models/perfil.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-perfis-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DrawerComponent, PageHeaderComponent],
  templateUrl: './perfis-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class PerfisListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<Perfil[]>([]);
  catalogoPermissoes = signal<Permissao[]>([]);

  recursos = computed(() => Array.from(new Set(this.catalogoPermissoes().map(p => p.recurso))).sort());

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  perfilEmEdicao = signal<Perfil | null>(null);
  salvando = signal(false);

  nome = '';
  descricao = '';
  permissaoIdsSelecionadas = new Set<number>();

  constructor(
    private perfisService: PerfisService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
    this.perfisService.listarPermissoes().subscribe({
      next: res => this.catalogoPermissoes.set(res.dados ?? [])
    });
  }

  carregar() {
    this.carregando.set(true);
    this.perfisService.listar().subscribe({
      next: res => {
        this.itens.set(res.dados ?? []);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os perfis.');
        this.carregando.set(false);
      }
    });
  }

  permissoesDoRecurso(recurso: string): Permissao[] {
    return this.catalogoPermissoes().filter(p => p.recurso === recurso);
  }

  abrirCriar() {
    this.modoDrawer.set('criar');
    this.perfilEmEdicao.set(null);
    this.nome = '';
    this.descricao = '';
    this.permissaoIdsSelecionadas = new Set();
    this.drawerAberto.set(true);
  }

  abrirEditar(perfil: Perfil) {
    this.modoDrawer.set('editar');
    this.perfilEmEdicao.set(perfil);
    this.nome = perfil.nome;
    this.descricao = perfil.descricao ?? '';
    this.permissaoIdsSelecionadas = new Set(perfil.permissoes.map(p => p.id));
    this.drawerAberto.set(true);
  }

  fecharDrawer() {
    this.drawerAberto.set(false);
  }

  alternarPermissao(permissaoId: number) {
    if (this.permissaoIdsSelecionadas.has(permissaoId)) {
      this.permissaoIdsSelecionadas.delete(permissaoId);
    } else {
      this.permissaoIdsSelecionadas.add(permissaoId);
    }
  }

  alternarRecursoInteiro(recurso: string) {
    const ids = this.permissoesDoRecurso(recurso).map(p => p.id);
    const todasMarcadas = ids.every(id => this.permissaoIdsSelecionadas.has(id));
    ids.forEach(id => todasMarcadas ? this.permissaoIdsSelecionadas.delete(id) : this.permissaoIdsSelecionadas.add(id));
  }

  recursoTotalmenteMarcado(recurso: string): boolean {
    const ids = this.permissoesDoRecurso(recurso).map(p => p.id);
    return ids.length > 0 && ids.every(id => this.permissaoIdsSelecionadas.has(id));
  }

  salvar() {
    const nome = this.nome.trim();
    if (!nome) {
      this.toast.erro('Nome do perfil é obrigatório.');
      return;
    }

    this.salvando.set(true);
    const payload = { nome, descricao: this.descricao.trim() || undefined };

    const request = this.modoDrawer() === 'criar'
      ? this.perfisService.criar(payload)
      : this.perfisService.atualizar(this.perfilEmEdicao()!.id, payload);

    request.subscribe({
      next: perfilResultado => {
        const perfilId = this.modoDrawer() === 'criar' ? perfilResultado.dados!.id : this.perfilEmEdicao()!.id;
        this.perfisService.atribuirPermissoes(perfilId, { permissaoIds: Array.from(this.permissaoIdsSelecionadas) }).subscribe({
          next: () => {
            this.salvando.set(false);
            this.toast.sucesso(this.modoDrawer() === 'criar' ? 'Perfil criado.' : 'Perfil atualizado.');
            this.fecharDrawer();
            this.carregar();
          },
          error: err => {
            this.salvando.set(false);
            this.toast.erroServidor(err, 'Perfil salvo, mas falhou ao gravar permissões.');
            this.fecharDrawer();
            this.carregar();
          }
        });
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar o perfil.');
      }
    });
  }

  inativar(perfil: Perfil) {
    this.perfisService.inativar(perfil.id).subscribe({
      next: () => {
        this.toast.sucesso('Perfil inativado.');
        this.carregar();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível inativar o perfil.')
    });
  }
}
