import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ContagemEstoqueService } from '../../services/contagem-estoque.service';
import { PreviewContagem } from '../../models/contagem-estoque.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-contagem-revisao',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './contagem-revisao.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContagemRevisaoComponent implements OnInit {
  preview = signal<PreviewContagem | null>(null);
  linhasIncluidas = new Set<number>();
  confirmando = signal(false);

  constructor(
    private contagemService: ContagemEstoqueService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    const preview = this.contagemService.previewPendente;
    this.contagemService.previewPendente = null;
    if (!preview) {
      this.router.navigate(['/balanco/planilha']);
      return;
    }
    this.preview.set(preview);
    this.linhasIncluidas = new Set(
      preview.itens
        .map((item, indice) => ({ item, indice }))
        .filter(x => !x.item.erro)
        .map(x => x.indice)
    );
  }

  linhaIncluida(indice: number): boolean {
    return this.linhasIncluidas.has(indice);
  }

  aoAlternarLinhaIncluida(indice: number, marcado: boolean) {
    if (marcado) this.linhasIncluidas.add(indice);
    else this.linhasIncluidas.delete(indice);
  }

  qtdIncluidas(): number {
    return this.linhasIncluidas.size;
  }

  cancelar() {
    this.contagemService.previewPendente = null;
    this.router.navigate(['/balanco/planilha']);
  }

  confirmarAplicacao() {
    const itens = this.preview()?.itens ?? [];
    const selecionados = itens
      .map((item, indice) => ({ item, indice }))
      .filter(x => this.linhasIncluidas.has(x.indice) && x.item.idProduto !== null)
      .map(x => ({
        idProduto: x.item.idProduto as number,
        quantidadeContada: x.item.quantidadeContada,
        quantidadeSistemaExportacao: x.item.quantidadeExportacao
      }));

    if (selecionados.length === 0) {
      this.toast.erro('Selecione ao menos um item pra aplicar.');
      return;
    }

    this.confirmando.set(true);
    this.contagemService.confirmar(selecionados).subscribe({
      next: res => {
        this.confirmando.set(false);
        this.toast.sucesso('Contagem aplicada.', `${res.dados?.produtosAtualizados ?? 0} produto(s) atualizado(s).`);
        this.contagemService.previewPendente = null;
        this.router.navigate(['/balanco/planilha']);
      },
      error: err => {
        this.confirmando.set(false);
        this.toast.erroServidor(err, 'Não foi possível aplicar a contagem.');
      }
    });
  }
}
