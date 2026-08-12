import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';
import { EtlJobsService } from '../../services/etl-jobs.service';
import { EtlJobStatusResposta } from '../../dtos/etl-job-status.resposta';
import { EtlPipelineEntidadeResposta } from '../../dtos/etl-pipeline-entidade.resposta';
import { formatarCron } from '../../utils/cron-legivel';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { ToastService } from '../../../../core/feedback/toast.service';

@Component({
  selector: 'app-etl-contexto-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm">
          <li class="text-slate-600">Início</li>
          <li class="text-slate-400">/</li>
          <li class="text-slate-600">Integrações</li>
          <li class="text-slate-400">/</li>
          <li class="text-slate-600">
            <a routerLink="/integracoes/tiny" class="text-blue-600 hover:text-blue-700">ERP Tiny</a>
          </li>
          <li class="text-slate-400">/</li>
          <li class="font-semibold text-slate-900 capitalize">{{ entidade() }}</li>
        </ol>
      </nav>

      <h1 class="text-3xl font-bold text-slate-900 mb-2 capitalize">ETL — {{ entidade() }}</h1>
      <p class="text-slate-600 mb-8">Detalhes de processamento para {{ entidade() }}</p>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Pendentes</div>
          <div class="text-3xl font-bold text-amber-600">{{ pipeline().pendentes }}</div>
          <div class="text-xs text-slate-500 mt-1">aguardando processamento</div>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Processados</div>
          <div class="text-3xl font-bold text-green-600">{{ pipeline().processados }}</div>
          <div class="text-xs text-slate-500 mt-1">enviados para ERP</div>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Erros</div>
          <div class="text-3xl font-bold text-red-600">{{ pipeline().erros }}</div>
          <div class="text-xs text-slate-500 mt-1 mb-3">elegiveis para reprocessar</div>
          <button
            (click)="reprocessarErros()"
            [disabled]="pipeline().erros === 0 || reprocessandoErros()"
            class="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="material-symbols-outlined text-sm" [class.animate-spin]="reprocessandoErros()">
              {{ reprocessandoErros() ? 'progress_activity' : 'refresh' }}
            </span>
            {{ reprocessandoErros() ? 'Reprocessando...' : 'Reprocessar erros' }}
          </button>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Dead-letter</div>
          <div class="text-3xl font-bold text-gray-600">{{ pipeline().deadLetter }}</div>
          <div class="text-xs text-slate-500 mt-1 mb-3">falhas permanentes</div>
          <button
            (click)="reprocessarDeadLetter()"
            [disabled]="pipeline().deadLetter === 0 || reprocessandoDeadLetter()"
            class="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="material-symbols-outlined text-sm" [class.animate-spin]="reprocessandoDeadLetter()">
              {{ reprocessandoDeadLetter() ? 'progress_activity' : 'restart_alt' }}
            </span>
            {{ reprocessandoDeadLetter() ? 'Reprocessando...' : 'Reprocessar dead-letter' }}
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
        <div class="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100 capitalize">Jobs — {{ entidade() }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Nome do Job</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Cron</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Última Exec</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Próxima Exec</th>
                <th class="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              @for (job of jobsEntidade(); track job.jobId) {
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td class="px-4 py-3 text-slate-900 dark:text-slate-100">{{ job.displayName }}</td>
                  <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs" [title]="job.cronExpression">{{ formatarCron(job.cronExpression) }}</td>
                  <td class="px-4 py-3">
                    @if (!job.pausado) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <span class="size-1.5 bg-green-600 rounded-full animate-pulse"></span>
                        Ativo
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        Pausado
                      </span>
                    }
                  </td>
                  <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                    {{ job.ultimaExecucao ? (job.ultimaExecucao | date: 'dd/MM/yy, HH:mm') : '—' }}
                  </td>
                  <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                    {{ job.proximaExecucao ? (job.proximaExecucao | date: 'dd/MM/yy, HH:mm') : '—' }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex justify-center gap-2">
                      <button (click)="disparar(job.jobId)" class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        Disparar
                      </button>
                      @if (!job.pausado) {
                        <button (click)="pausar(job.jobId)" class="px-2 py-1 text-xs font-semibold rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                          Pausar
                        </button>
                      } @else {
                        <button (click)="retomar(job.jobId)" class="px-2 py-1 text-xs font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                          Retomar
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class EtlContextoPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #jobsService = inject(EtlJobsService);
  readonly #confirm = inject(ConfirmService);
  readonly #toast = inject(ToastService);

  readonly formatarCron = formatarCron;

  entidade = toSignal(
    this.#route.paramMap.pipe(map(params => params.get('entidade') || '')),
    { initialValue: '' }
  );

  pipeline = signal<EtlPipelineEntidadeResposta>(
    { entidade: '', pendentes: 0, processados: 0, erros: 0, deadLetter: 0 } as EtlPipelineEntidadeResposta
  );

  reprocessandoErros = signal(false);
  reprocessandoDeadLetter = signal(false);

  constructor() {
    effect(() => {
      const ent = this.entidade();
      if (!ent) return;
      this.carregarPipeline(ent);
    });
  }

  private carregarPipeline(entidade: string): void {
    this.#jobsService.pipelineEntidade(entidade).subscribe(resultado => {
      if (resultado.dados) this.pipeline.set(resultado.dados);
    });
  }

  readonly #allJobs = toSignal(
    this.#jobsService.listarJobs().pipe(
      switchMap(resultado => resultado.dados ? [resultado.dados] : [])
    ),
    { initialValue: [] as EtlJobStatusResposta[] }
  );

  jobsEntidade = computed(() => {
    const jobs = this.#allJobs();
    const ent = this.entidade();
    return jobs.filter(j => j.entidade === ent);
  });

  disparar(jobId: string): void {
    this.#jobsService.disparar(jobId).subscribe();
  }

  pausar(jobId: string): void {
    this.#jobsService.pausar(jobId).subscribe();
  }

  retomar(jobId: string): void {
    this.#jobsService.retomar(jobId).subscribe();
  }

  async reprocessarErros(): Promise<void> {
    const ent = this.entidade();
    const ok = await this.#confirm.confirmar(
      `Reprocessar ${this.pipeline().erros} erro(s) de ${ent}?`,
      'Os itens voltam para a fila e são reprocessados no próximo ciclo do job.',
      { textoConfirmar: 'Reprocessar' }
    );
    if (!ok) return;

    this.reprocessandoErros.set(true);
    this.#jobsService.reprocessarErros(ent).subscribe({
      next: r => {
        this.#toast.sucesso('Reprocessado', `${r.dados?.total ?? 0} item(ns) voltaram pra fila.`);
        this.reprocessandoErros.set(false);
        this.carregarPipeline(ent);
      },
      error: err => {
        this.#toast.erroServidor(err, 'Não foi possível reprocessar os erros.');
        this.reprocessandoErros.set(false);
      }
    });
  }

  async reprocessarDeadLetter(): Promise<void> {
    const ent = this.entidade();
    const ok = await this.#confirm.confirmar(
      `Reprocessar ${this.pipeline().deadLetter} item(ns) em dead-letter de ${ent}?`,
      'São falhas permanentes (esgotaram as tentativas). Voltam pra fila do zero — confirme se a causa raiz já foi corrigida.',
      { textoConfirmar: 'Reprocessar' }
    );
    if (!ok) return;

    this.reprocessandoDeadLetter.set(true);
    this.#jobsService.reprocessarDeadLetter(ent).subscribe({
      next: r => {
        this.#toast.sucesso('Reprocessado', `${r.dados?.total ?? 0} item(ns) voltaram pra fila.`);
        this.reprocessandoDeadLetter.set(false);
        this.carregarPipeline(ent);
      },
      error: err => {
        this.#toast.erroServidor(err, 'Não foi possível reprocessar o dead-letter.');
        this.reprocessandoDeadLetter.set(false);
      }
    });
  }
}
