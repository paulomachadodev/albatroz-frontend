import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { ConexaoMetaComponent } from './conexao-meta.component';
import { PerfilSocial, PLATAFORMAS_SOCIAIS, PERFIL_SELECT_PT } from '../../models/perfil-social.model';
import { PT_TOGGLE } from '../../../../../shared/utils/pt-toggle';
import { PerfisSociaisService } from '../../services/perfis-sociais.service';
@Component({ selector: 'app-perfis-sociais', standalone: true, imports: [ToggleSwitchModule, DatePipe, ReactiveFormsModule, SelectModule, BreadcrumbComponent, PageHeaderComponent, ModalComponent, ListagemPaginadaComponent, ConexaoMetaComponent], templateUrl: './perfis-sociais.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class PerfisSociaisComponent {
  readonly selectPt = PERFIL_SELECT_PT;
  readonly togglePt = PT_TOGGLE;
  private readonly service = inject(PerfisSociaisService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly empresa = this.auth.empresaIdAtual();
  private readonly usuario = this.auth.usuario()?.id;
  private consulta?: Subscription;
  private gravacao?: Subscription;
  readonly acesso = computed(() => this.auth.empresaIdAtual() === this.empresa && this.auth.usuario()?.id === this.usuario && this.auth.temPermissao('integracoes_sociais:ler'));
  readonly podeCriar = computed(() => this.acesso() && this.auth.temPermissao('integracoes_sociais:criar'));
  readonly podeEditar = computed(() => this.acesso() && this.auth.temPermissao('integracoes_sociais:editar'));
  readonly habilitado = signal(false);
  readonly itens = signal<PerfilSocial[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly modal = signal(false);
  readonly edicao = signal<PerfilSocial | null>(null);
  readonly plataformas = PLATAFORMAS_SOCIAIS;
  readonly podeSalvar = computed(() => this.habilitado() && (this.edicao() ? this.podeEditar() : this.podeCriar()));
  readonly form = inject(FormBuilder).nonNullable.group({ plataforma: [2, [Validators.required, Validators.min(1), Validators.max(4)]], nome: ['', [Validators.required, Validators.maxLength(120)]], identificador: ['', [Validators.required, Validators.maxLength(160), Validators.pattern(/^[A-Za-z0-9@._+-]+$/)]], ativo: true });
  constructor() {
    effect(() => {
      if (!this.acesso()) {
        this.consulta?.unsubscribe(); this.gravacao?.unsubscribe(); this.itens.set([]); this.modal.set(false); this.form.reset(); this.carregando.set(false); this.salvando.set(false);
        queueMicrotask(() => { if (!this.destroyRef.destroyed) void this.router.navigate(['/configuracoes'], { replaceUrl: true }); });
      }
      if (this.modal() && !this.podeSalvar()) { this.gravacao?.unsubscribe(); this.modal.set(false); this.form.reset(); this.salvando.set(false); }
    });
    this.carregar();
  }
  carregar(): void {
    if (!this.acesso() || this.salvando()) return;
    this.consulta?.unsubscribe(); this.carregando.set(true);
    this.consulta = this.service.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: res => { if (!this.acesso()) return; this.carregando.set(false); if (res.sucesso && res.dados) { this.habilitado.set(res.dados.habilitado); this.itens.set(res.dados.itens); } else this.toast.erro('Não foi possível consultar os perfis.'); }, error: erro => { if (this.acesso()) { this.carregando.set(false); this.toast.erroServidor(erro, 'Não foi possível consultar os perfis.'); } } });
  }
  abrir(perfil: PerfilSocial | null = null): void {
    if (!this.habilitado() || (perfil ? !this.podeEditar() : !this.podeCriar())) return;
    this.edicao.set(perfil); this.form.reset(perfil ?? { plataforma: 2, nome: '', identificador: '', ativo: true }); this.modal.set(true);
  }
  fechar(): void { if (!this.salvando()) this.modal.set(false); }
  salvar(): void {
    this.form.markAllAsTouched(); if (!this.podeSalvar() || this.form.invalid || this.salvando()) return;
    const dados = this.form.getRawValue(); dados.nome = dados.nome.trim(); dados.identificador = dados.identificador.trim(); if (!dados.nome) return;
    const perfil = this.edicao(); this.salvando.set(true);
    this.gravacao = (perfil ? this.service.atualizar(perfil.id, dados, perfil.versao) : this.service.criar(dados)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: res => { if (!this.acesso() || !this.podeSalvar()) return; this.salvando.set(false); if (res.sucesso && res.dados) { this.modal.set(false); this.toast.sucesso('Perfil editorial salvo.'); this.carregar(); } else this.toast.erro('Não foi possível salvar o perfil.'); }, error: erro => { if (this.acesso() && this.podeSalvar()) { this.salvando.set(false); this.toast.erroServidor(erro, 'Não foi possível salvar. Atualize a consulta antes de repetir.'); } } });
  }
  plataforma(valor: number): string { return this.plataformas.find(item => item.valor === valor)?.rotulo ?? 'Desconhecida'; }
}
