import { Component, OnInit, signal, computed } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import { PerfisService } from '../../../perfis/services/perfis.service';
import { Usuario } from '../../models/usuario.model';
import { Perfil } from '../../../perfis/models/perfil.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../../shared/components/th-ordenavel/th-ordenavel.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [RouterLink, FormsModule, DrawerComponent, PageHeaderComponent, ThOrdenavelComponent],
  templateUrl: './usuarios-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class UsuariosListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<Usuario[]>([]);
  perfisDisponiveis = signal<Perfil[]>([]);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  // Lista pequena (não paginada) — ordenação é client-side, sem round-trip ao backend.
  itensOrdenados = computed(() => {
    const ordenacao = this.ordenacaoAtual();
    const lista = [...this.itens()];
    if (!ordenacao) return lista;
    const dir = ordenacao.direcao === 'asc' ? 1 : -1;
    return lista.sort((a, b) => {
      const va = ordenacao.campo === 'email' ? a.email : ordenacao.campo === 'situacao' ? a.situacao : a.nome;
      const vb = ordenacao.campo === 'email' ? b.email : ordenacao.campo === 'situacao' ? b.situacao : b.nome;
      return va.localeCompare(vb) * dir;
    });
  });

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  usuarioEmEdicao = signal<Usuario | null>(null);
  salvando = signal(false);

  nome = '';
  email = '';
  senha = '';
  perfilIdsSelecionados = new Set<number>();

  constructor(
    private usuariosService: UsuariosService,
    private perfisService: PerfisService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
    this.perfisService.listar().subscribe({
      next: res => this.perfisDisponiveis.set(res.dados ?? [])
    });
  }

  carregar() {
    this.carregando.set(true);
    this.usuariosService.listar().subscribe({
      next: res => {
        this.itens.set(res.dados ?? []);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os usuários.');
        this.carregando.set(false);
      }
    });
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
  }

  abrirCriar() {
    this.modoDrawer.set('criar');
    this.usuarioEmEdicao.set(null);
    this.nome = '';
    this.email = '';
    this.senha = '';
    this.perfilIdsSelecionados = new Set();
    this.drawerAberto.set(true);
  }

  abrirEditar(usuario: Usuario) {
    this.modoDrawer.set('editar');
    this.usuarioEmEdicao.set(usuario);
    this.nome = usuario.nome;
    this.email = usuario.email;
    this.senha = '';
    this.perfilIdsSelecionados = new Set(
      this.perfisDisponiveis().filter(p => usuario.perfis.includes(p.nome)).map(p => p.id)
    );
    this.drawerAberto.set(true);
  }

  fecharDrawer() {
    this.drawerAberto.set(false);
  }

  alternarPerfil(perfilId: number) {
    if (this.perfilIdsSelecionados.has(perfilId)) {
      this.perfilIdsSelecionados.delete(perfilId);
    } else {
      this.perfilIdsSelecionados.add(perfilId);
    }
  }

  salvar() {
    const nome = this.nome.trim();
    const email = this.email.trim();
    if (!nome || !email) {
      this.toast.erro('Nome e e-mail são obrigatórios.');
      return;
    }

    if (this.modoDrawer() === 'criar') {
      if (!this.senha || this.senha.length < 8) {
        this.toast.erro('Senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.');
        return;
      }

      this.salvando.set(true);
      this.usuariosService.criar({ nome, email, senha: this.senha }).subscribe({
        next: usuarioCriado => this.aplicarPerfisEFinalizar(usuarioCriado.dados!.id, 'Usuário criado.'),
        error: err => {
          this.salvando.set(false);
          this.toast.erroServidor(err, 'Não foi possível criar o usuário.');
        }
      });
      return;
    }

    this.salvando.set(true);
    const id = this.usuarioEmEdicao()!.id;
    this.usuariosService.atualizar(id, { nome, email }).subscribe({
      next: () => this.aplicarPerfisEFinalizar(id, 'Usuário atualizado.'),
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar o usuário.');
      }
    });
  }

  private aplicarPerfisEFinalizar(usuarioId: number, mensagemSucesso: string) {
    this.usuariosService.atribuirPerfis(usuarioId, { perfilIds: Array.from(this.perfilIdsSelecionados) }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso(mensagemSucesso);
        this.fecharDrawer();
        this.carregar();
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Usuário salvo, mas falhou ao atribuir perfis.');
        this.fecharDrawer();
        this.carregar();
      }
    });
  }

  alternarBloqueio(usuario: Usuario) {
    const acao = usuario.situacao === 'Bloqueado'
      ? this.usuariosService.desbloquear(usuario.id)
      : this.usuariosService.bloquear(usuario.id);

    acao.subscribe({
      next: () => {
        this.toast.sucesso(usuario.situacao === 'Bloqueado' ? 'Usuário desbloqueado.' : 'Usuário bloqueado.');
        this.carregar();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível alterar o bloqueio do usuário.')
    });
  }
}
