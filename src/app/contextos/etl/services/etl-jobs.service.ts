import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EtlApiService } from '../../../core/http/etl-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Resultado } from '../../../core/models/resultado.model';
import { EtlJobStatusResposta } from '../dtos/etl-job-status.resposta';
import { EtlPipelineEntidadeResposta } from '../dtos/etl-pipeline-entidade.resposta';

@Injectable({ providedIn: 'root' })
export class EtlJobsService {
  private api = inject(EtlApiService);
  private auth = inject(AuthService);

  private readonly jobs = '/v1/etl/jobs';

  private empresaId(): number {
    const empresaId = this.auth.empresaIdAtual();
    if (empresaId === null) throw new Error('Empresa não identificada na sessão do usuário.');
    return empresaId;
  }

  listarJobs(): Observable<Resultado<EtlJobStatusResposta[]>> {
    return this.api.get<EtlJobStatusResposta[]>(this.jobs, { empresaId: this.empresaId() });
  }

  disparar(jobId: string): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.jobs}/${jobId}/disparar?empresaId=${this.empresaId()}`);
  }

  pausar(jobId: string): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.jobs}/${jobId}/pausar?empresaId=${this.empresaId()}`);
  }

  retomar(jobId: string): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.jobs}/${jobId}/retomar?empresaId=${this.empresaId()}`);
  }

  pipelineEntidade(entidade: string): Observable<Resultado<EtlPipelineEntidadeResposta>> {
    return this.api.get<EtlPipelineEntidadeResposta>(`/v1/etl/pipeline/${entidade}`, { empresaId: this.empresaId() });
  }

  pipelineResumo(): Observable<Resultado<EtlPipelineEntidadeResposta[]>> {
    return this.api.get<EtlPipelineEntidadeResposta[]>('/v1/etl/pipeline/resumo', { empresaId: this.empresaId() });
  }

  reprocessarErros(entidade: string): Observable<Resultado<{ total: number }>> {
    return this.api.post<{ total: number }>(`/v1/etl/pipeline/${entidade}/reprocessar-erros?empresaId=${this.empresaId()}`);
  }

  reprocessarDeadLetter(entidade: string): Observable<Resultado<{ total: number }>> {
    return this.api.post<{ total: number }>(`/v1/etl/pipeline/${entidade}/reprocessar-dead-letter?empresaId=${this.empresaId()}`);
  }

  saudeFilas(): Observable<Resultado<SaudeFilasResposta>> {
    return this.api.get<SaudeFilasResposta>('/v1/etl/filas/saude');
  }
}

export interface SaudeFilasResposta {
  filas: SaudeFila[];
  travados: WorkerTravado[];
}

export interface SaudeFila {
  fila: string;
  pendentesNaoBuscados: number;
  idadeMaisAntigoMinutos: number;
}

// Lock de DisableConcurrentExecution preso além do prazo do JobDeadlineGuard (8min, sempre
// libera sozinho) — diferente de idadeMaisAntigoMinutos em SaudeFila, que pode ficar alto por
// horas em operação normal (Hangfire.PostgreSql não garante FIFO no fetch), isso aqui é sinal
// real de travamento.
export interface WorkerTravado {
  job: string;
  minutosPreso: number;
}
