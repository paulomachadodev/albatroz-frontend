import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { DdaService } from '../../services/dda.service';
import { ImportacaoDda } from '../../models/dda.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';

const STATUS_LABELS: Record<number, string> = {
  1: 'Importado',
  2: 'Conciliado',
  3: 'Baixado'
};

@Component({
  selector: 'app-dda-lista',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './dda-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class DdaListaComponent implements OnInit {
  importacoes = signal<ImportacaoDda[]>([]);
  carregando  = signal(false);
  importando  = signal(false);

  breadcrumbs = [
    { label: 'Financeiro' },
    { label: 'Conciliação DDA' }
  ];

  constructor(
    private ddaService: DdaService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.ddaService.listar().subscribe({
      next: res => {
        this.importacoes.set(res.dados ?? []);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Erro ao carregar importações DDA.');
        this.carregando.set(false);
      }
    });
  }

  onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    input.value = '';
    this.importando.set(true);
    this.ddaService.importar(arquivo).subscribe({
      next: res => {
        this.toast.sucesso(`Arquivo importado: ${res.dados?.totalLancamentos} lançamentos.`);
        this.carregar();
        this.importando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Erro ao importar arquivo CNAB 240.');
        this.importando.set(false);
      }
    });
  }

  statusLabel(status: number): string {
    return STATUS_LABELS[status] ?? 'Desconhecido';
  }

  badgeClass(status: number): string {
    if (status === 3) return 'badge-success';
    if (status === 2) return 'badge-info';
    return 'badge-neutral';
  }
}
