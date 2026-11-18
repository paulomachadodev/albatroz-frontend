import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PecaResumo, STATUS_PECA } from '../../models/peca.model';
import { PecasService } from '../../services/pecas.service';

@Component({
  selector: 'app-pecas-lista',
  standalone: true,
  imports: [DatePipe, RouterLink, BreadcrumbComponent, PageHeaderComponent, ListagemPaginadaComponent],
  templateUrl: './pecas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class PecasListaComponent {
  private readonly service = inject(PecasService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usuarioInicial = this.auth.usuario()?.id;
  private readonly empresaInicial = this.auth.empresaIdAtual();
  private consulta?: Subscription;
  readonly contextoValido = computed(() => this.auth.usuario()?.id === this.usuarioInicial && this.auth.empresaIdAtual() === this.empresaInicial && this.auth.temPermissao('marketing:ler'));
  readonly carregando = signal(true);
  readonly habilitado = signal(false);
  readonly itens = signal<PecaResumo[]>([]);
  readonly status = STATUS_PECA;

  constructor() {
    this.destroyRef.onDestroy(() => this.consulta?.unsubscribe());
    effect(() => {
      if (this.contextoValido()) return;
      this.consulta?.unsubscribe();
      this.itens.set([]);
      this.carregando.set(false);
      queueMicrotask(() => { if (!this.destroyRef.destroyed) void this.router.navigate(['/marketing'], { replaceUrl: true }); });
    });
    this.carregar();
  }

  carregar(): void {
    if (!this.contextoValido()) return;
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.consulta = this.service.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (!this.contextoValido()) return;
        this.carregando.set(false);
        if (res.sucesso && res.dados) { this.habilitado.set(res.dados.habilitado); this.itens.set(res.dados.itens); }
        else this.toast.erro('Não foi possível consultar as peças.');
      },
      error: erro => { this.carregando.set(false); this.toast.erroServidor(erro, 'Não foi possível consultar as peças.'); }
    });
  }
}
