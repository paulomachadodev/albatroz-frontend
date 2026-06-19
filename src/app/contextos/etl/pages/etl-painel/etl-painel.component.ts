import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EtlJobsService } from '../../services/etl-jobs.service';
import { EtlJobStatusResposta } from '../../dtos/etl-job-status.resposta';
import { EtlPipelinePedidosResposta } from '../../dtos/etl-pipeline-pedidos.resposta';

@Component({
  selector: 'app-etl-painel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './etl-painel.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EtlPainelComponent implements OnInit {
  jobs = signal<EtlJobStatusResposta[]>([]);
  pipeline = signal<EtlPipelinePedidosResposta | null>(null);
  carregando = signal(true);
  carregandoAcao = signal<string | null>(null);
  confirmandoReprocessar = signal(false);

  jobsPedidos = computed(() =>
    this.jobs().filter(j => j.entidade === 'pedidos')
  );

  constructor(private readonly etlService: EtlJobsService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    let jobs$ = this.etlService.listarJobs();
    let pipe$ = this.etlService.statusPipelinePedidos();

    let jobsDone = false;
    let pipeDone = false;

    const checkDone = () => {
      if (jobsDone && pipeDone) this.carregando.set(false);
    };

    jobs$.subscribe({
      next: r => { if (r.sucesso) this.jobs.set(r.dados ?? []); },
      complete: () => { jobsDone = true; checkDone(); }
    });

    pipe$.subscribe({
      next: r => { if (r.sucesso) this.pipeline.set(r.dados ?? null); },
      complete: () => { pipeDone = true; checkDone(); }
    });
  }

  disparar(jobId: string): void {
    this.carregandoAcao.set(jobId);
    this.etlService.disparar(jobId).subscribe({
      next: () => this.carregar(),
      complete: () => this.carregandoAcao.set(null)
    });
  }

  pausar(jobId: string): void {
    this.carregandoAcao.set(jobId);
    this.etlService.pausar(jobId).subscribe({
      next: () => this.carregar(),
      complete: () => this.carregandoAcao.set(null)
    });
  }

  retomar(jobId: string): void {
    this.carregandoAcao.set(jobId);
    this.etlService.retomar(jobId).subscribe({
      next: () => this.carregar(),
      complete: () => this.carregandoAcao.set(null)
    });
  }

  confirmarReprocessar(): void {
    this.confirmandoReprocessar.set(true);
  }

  cancelarReprocessar(): void {
    this.confirmandoReprocessar.set(false);
  }

  reprocessarErros(): void {
    this.confirmandoReprocessar.set(false);
    this.carregandoAcao.set('reprocessar');
    this.etlService.reprocessarErrosPedidos().subscribe({
      next: () => this.carregar(),
      complete: () => this.carregandoAcao.set(null)
    });
  }

  formatarData(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
