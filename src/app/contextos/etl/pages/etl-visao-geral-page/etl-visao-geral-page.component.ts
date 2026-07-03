import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap } from 'rxjs';
import { EtlJobsService } from '../../services/etl-jobs.service';
import { EtlJobStatusResposta } from '../../dtos/etl-job-status.resposta';
import { EtlPipelineEntidadeResposta } from '../../dtos/etl-pipeline-entidade.resposta';

@Component({
  selector: 'app-etl-visao-geral-page',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'flex-1 flex flex-col min-h-0' },
  template: `
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
      <div class="w-full space-y-8">
      <!-- Breadcrumb -->
      <nav>
        <ol class="flex items-center gap-2 text-sm">
          <li class="text-slate-600">Início</li>
          <li class="text-slate-400">/</li>
          <li class="text-slate-600">Integrações</li>
          <li class="text-slate-400">/</li>
          <li class="font-semibold text-slate-900">ERP Tiny</li>
        </ol>
      </nav>

      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-slate-900 mb-2">ERP Tiny — Visão Geral</h1>
        <p class="text-slate-600">Monitoramento em tempo real de todos os pipelines ETL</p>
      </div>

      <!-- KPI Cards —6 entidades -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (pipeline of pipelines(); track pipeline.entidade) {
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div class="text-sm font-semibold text-slate-600 dark:text-slate-400 capitalize mb-3">
              {{ pipeline.entidade }}
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div class="text-center">
                <div class="text-xl font-bold text-amber-600">{{ pipeline.pendentes }}</div>
                <div class="text-xs text-slate-500">Pendentes</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-green-600">{{ pipeline.processados }}</div>
                <div class="text-xs text-slate-500">Processados</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-red-600">{{ pipeline.erros }}</div>
                <div class="text-xs text-slate-500">Erros</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-gray-600">{{ pipeline.deadLetter }}</div>
                <div class="text-xs text-slate-500">Dead-letter</div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Jobs Table -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Todos os Jobs (17)</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Nome do Job</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Entidade</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Cron</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Última Exec</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Próxima Exec</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Pendentes</th>
                <th class="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              @for (job of jobs(); track job.jobId) {
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td class="px-4 py-3 text-slate-900 dark:text-slate-100">{{ job.displayName }}</td>
                  <td class="px-4 py-3 text-slate-600 dark:text-slate-400 capitalize">{{ job.entidade }}</td>
                  <td class="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{{ job.cronExpression }}</td>
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
                  <td class="px-4 py-3 text-right">
                    @if (job.pendentesStagingCount > 0) {
                      <span class="inline-flex items-center justify-center size-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-bold text-amber-700 dark:text-amber-400">
                        {{ job.pendentesStagingCount }}
                      </span>
                    } @else {
                      <span class="text-slate-400">0</span>
                    }
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
    </div>
  `
})
export class EtlVisaoGeralPageComponent {
  private readonly jobsService = inject(EtlJobsService);

  jobs = toSignal(
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.jobsService.listarJobs()),
    ).pipe(
      switchMap(resultado => resultado.dados ? [resultado.dados] : [])
    ),
    { initialValue: [] as EtlJobStatusResposta[] }
  );

  pipelines = toSignal(
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.jobsService.pipelineResumo()),
    ).pipe(
      switchMap(resultado => resultado.dados ? [resultado.dados] : [])
    ),
    { initialValue: [] as EtlPipelineEntidadeResposta[] }
  );

  disparar(jobId: string): void {
    this.jobsService.disparar(jobId).subscribe();
  }

  pausar(jobId: string): void {
    this.jobsService.pausar(jobId).subscribe();
  }

  retomar(jobId: string): void {
    this.jobsService.retomar(jobId).subscribe();
  }
}
