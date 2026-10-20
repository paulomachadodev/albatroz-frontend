import { Component, OnInit, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import { PerfisService } from '../../../perfis/services/perfis.service';
import { Usuario } from '../../models/usuario.model';
import { Perfil } from '../../../perfis/models/perfil.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [FormsModule, DrawerComponent, PageHeaderComponent, ThOrdenavelComponent, BreadcrumbComponent],
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
    this.perfilIdsSelecionados = new Set();
    this.drawerAberto.set(true);
  }

  abrirEditar(usuario: Usuario) {
    this.modoDrawer.set('editar');
    this.usuarioEmEdicao.set(usuario);
    this.nome = usuario.nome;
    this.email = usuario.email;
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
      if (!this.emailValido(email)) {
        this.toast.erro('Informe um e-mail válido.');
        return;
      }

      this.salvando.set(true);
      this.usuariosService.criar({ nome, email }).subscribe({
        next: usuarioCriado => this.aplicarPerfisEFinalizar(
          usuarioCriado.dados!.id,
          usuarioCriado.dados!.conviteEnviado === false
            ? 'Usuário criado, mas o e-mail de ativação não foi enviado. Use Reenviar convite.'
            : 'Usuário criado. Enviamos um e-mail para ele ativar a conta.'
        ),
        error: err => {
          this.salvando.set(false);
          this.toast.erroServidor(err, 'Não foi possível criar o usuário.');
        }
      });
      return;
    }

    if (!this.emailValido(email)) {
      this.toast.erro('Informe um e-mail válido.');
      return;
    }

    this.salvando.set(true);
    const id = this.usuarioEmEdicao()!.id;
    const nomeUsuario = this.usuarioEmEdicao()!.nomeUsuario;
    this.usuariosService.atualizar(id, { nome, email, nomeUsuario }).subscribe({
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

  emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  reenviarConvite(usuario: Usuario) {
    this.usuariosService.reenviarConvite(usuario.id).subscribe({
      next: () => this.toast.sucesso('Convite reenviado para ' + usuario.email + '.'),
      error: err => this.toast.erroServidor(err, 'Não foi possível reenviar o convite.')
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
