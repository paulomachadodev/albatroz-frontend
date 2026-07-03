import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EtlApiService } from '../../../core/http/etl-api.service';
import { Resultado } from '../../../core/models/resultado.model';
import { EtlJobStatusResposta } from '../dtos/etl-job-status.resposta';
import { EtlPipelinePedidosResposta } from '../dtos/etl-pipeline-pedidos.resposta';
import { EtlPipelineEntidadeResposta } from '../dtos/etl-pipeline-entidade.resposta';

@Injectable({ providedIn: 'root' })
export class EtlJobsService {
  private api = inject(EtlApiService);

  private readonly jobs = '/v1/etl/jobs';
  private readonly pipeline = '/v1/etl/pipeline/pedidos';

  listarJobs(): Observable<Resultado<EtlJobStatusResposta[]>> {
    return this.api.get<EtlJobStatusResposta[]>(this.jobs);
  }

  disparar(jobId: string): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.jobs}/${jobId}/disparar`);
  }

  pausar(jobId: string): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.jobs}/${jobId}/pausar`);
  }

  retomar(jobId: string): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.jobs}/${jobId}/retomar`);
  }

  statusPipelinePedidos(empresaId = 1): Observable<Resultado<EtlPipelinePedidosResposta>> {
    return this.api.get<EtlPipelinePedidosResposta>(this.pipeline, { empresaId });
  }

  reprocessarErrosPedidos(empresaId = 1): Observable<Resultado<{ total: number }>> {
    return this.api.post<{ total: number }>(`${this.pipeline}/reprocessar-erros`, null);
  }

  pipelineEntidade(entidade: string, empresaId = 1): Observable<Resultado<EtlPipelineEntidadeResposta>> {
    return this.api.get<EtlPipelineEntidadeResposta>(`/v1/etl/pipeline/${entidade}`, { empresaId });
  }

  pipelineResumo(empresaId = 1): Observable<Resultado<EtlPipelineEntidadeResposta[]>> {
    return this.api.get<EtlPipelineEntidadeResposta[]>('/v1/etl/pipeline/resumo', { empresaId });
  }
}
