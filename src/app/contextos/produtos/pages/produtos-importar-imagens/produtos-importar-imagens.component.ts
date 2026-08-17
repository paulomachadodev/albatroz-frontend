import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProdutosService } from '../../services/produtos.service';
import { ProdutoImportarImagensResposta } from '../../dtos/produto-resposta.dto';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-produtos-importar-imagens',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './produtos-importar-imagens.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosImportarImagensComponent {
  arquivos = signal<File[]>([]);
  arrastandoSobreZona = signal(false);
  processandoPreview = signal(false);
  confirmandoImportacao = signal(false);
  resultadoPreview = signal<ProdutoImportarImagensResposta | null>(null);
  resultadoFinal = signal<ProdutoImportarImagensResposta | null>(null);

  constructor(
    private produtosService: ProdutosService,
    private toast: ToastService,
    private router: Router
  ) {}

  voltar() {
    this.router.navigate(['/produtos']);
  }

  aoSelecionarArquivos(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.definirArquivos(Array.from(input.files));
    input.value = '';
  }

  aoArrastarSobre(event: DragEvent) {
    event.preventDefault();
    this.arrastandoSobreZona.set(true);
  }

  aoSairDaZona() {
    this.arrastandoSobreZona.set(false);
  }

  aoSoltar(event: DragEvent) {
    event.preventDefault();
    this.arrastandoSobreZona.set(false);
    const arquivos = event.dataTransfer?.files;
    if (!arquivos || arquivos.length === 0) return;
    this.definirArquivos(Array.from(arquivos));
  }

  private definirArquivos(arquivos: File[]) {
    const imagens = arquivos.filter(a => a.type.startsWith('image/'));
    if (imagens.length === 0) {
      this.toast.erro('Selecione apenas arquivos de imagem.');
      return;
    }
    this.arquivos.set(imagens);
    this.resultadoPreview.set(null);
    this.resultadoFinal.set(null);
    this.gerarPreview();
  }

  limpar() {
    this.arquivos.set([]);
    this.resultadoPreview.set(null);
    this.resultadoFinal.set(null);
  }

  private gerarPreview() {
    if (this.arquivos().length === 0) return;

    this.processandoPreview.set(true);
    this.produtosService.importarImagensLote(this.arquivos(), false).subscribe({
      next: res => {
        this.resultadoPreview.set(res.dados ?? null);
        this.processandoPreview.set(false);
      },
      error: err => {
        this.processandoPreview.set(false);
        this.toast.erroServidor(err, 'Não foi possível processar os arquivos.');
      }
    });
  }

  confirmarImportacao() {
    if (this.arquivos().length === 0) return;

    this.confirmandoImportacao.set(true);
    this.produtosService.importarImagensLote(this.arquivos(), true).subscribe({
      next: res => {
        this.resultadoFinal.set(res.dados ?? null);
        this.confirmandoImportacao.set(false);
        this.toast.sucesso('Importação concluída.');
      },
      error: err => {
        this.confirmandoImportacao.set(false);
        this.toast.erroServidor(err, 'Não foi possível confirmar a importação.');
      }
    });
  }
}
