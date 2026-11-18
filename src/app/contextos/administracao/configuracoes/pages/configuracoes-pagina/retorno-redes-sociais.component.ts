import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ConexaoMetaService } from '../../services/conexao-meta.service';

@Component({
  selector: 'app-retorno-redes-sociais',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex-1 flex items-center justify-center px-4 py-10">
      <div class="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center">
        @if (erro()) {
          <h1 class="text-lg font-bold">Conexão não concluída</h1>
          <p role="alert" class="text-sm text-slate-600 dark:text-slate-300">{{ erro() }}</p>
          <a routerLink="/configuracoes/redes-sociais" class="inline-block px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold">Voltar para Redes sociais</a>
        } @else {
          <h1 class="text-lg font-bold">Concluindo a conexão</h1>
          <p role="status" class="text-sm text-slate-500">Validando a autorização com a Meta. Não feche esta página.</p>
          <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
        }
      </div>
    </div>
  `,
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class RetornoRedesSociaisComponent {
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ConexaoMetaService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly erro = signal<string | null>(null);

  constructor() {
    const parametros = this.rota.snapshot.queryParamMap;
    const state = parametros.get('state') ?? '';
    const codigo = parametros.get('code');
    const erroProvedor = parametros.get('error') ?? parametros.get('error_reason');
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
    if (!state) {
      this.erro.set('O retorno da Meta não trouxe os dados esperados. Inicie a conexão novamente.');
      return;
    }
    this.service.concluir({ codigo, state, erroProvedor }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (res.sucesso && res.dados) {
          this.toast.sucesso('Conta Meta conectada.', 'Selecione a Página e o Instagram que a empresa vai usar.');
          void this.router.navigate(['/configuracoes/redes-sociais'], { replaceUrl: true });
        } else {
          this.erro.set('Não foi possível concluir a conexão.');
        }
      },
      error: erro => this.erro.set(this.toast.mensagemServidor(erro, 'Não foi possível concluir a conexão.'))
    });
  }
}
