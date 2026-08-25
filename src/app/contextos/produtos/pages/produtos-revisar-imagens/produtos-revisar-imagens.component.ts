import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProdutosService } from '../../services/produtos.service';
import { ImagemCandidata, STATUS_IMAGEM_CANDIDATA } from '../../models/produto.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-produtos-revisar-imagens',
  standalone: true,
  imports: [RouterLink, FormsModule, ListagemPaginadaComponent, PageHeaderComponent],
  templateUrl: './produtos-revisar-imagens.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosRevisarImagensComponent implements OnInit {
  readonly STATUS = STATUS_IMAGEM_CANDIDATA;

  carregando = signal(true);
  itens = signal<ImagemCandidata[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(20);

  processandoId = signal<number | null>(null);

  texto = '';
  // Nasce filtrada só por pendente — rejeitada/aprovada só aparecem se o usuário marcar.
  incluirPendente = true;
  incluirAprovada = false;
  incluirRejeitada = false;

  constructor(
    private produtosService: ProdutosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  private statusSelecionado(): number[] {
    const status: number[] = [];
    if (this.incluirPendente) status.push(this.STATUS.PENDENTE);
    if (this.incluirAprovada) status.push(this.STATUS.APROVADA);
    if (this.incluirRejeitada) status.push(this.STATUS.REJEITADA);
    return status;
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    const status = this.statusSelecionado();
    this.produtosService.listarImagensCandidatas(
      { pagina, tamanho: this.tamanhoPagina() },
      { texto: this.texto.trim() || undefined, status: status.length > 0 ? status : undefined }
    ).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as imagens candidatas.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  aprovar(item: ImagemCandidata) {
    this.processandoId.set(item.id);
    this.produtosService.aprovarImagemCandidata(item.id).subscribe({
      next: () => {
        this.processandoId.set(null);
        this.toast.sucesso(`Imagem aprovada — adicionada à galeria de ${item.nomeProduto}.`);
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.processandoId.set(null);
        this.toast.erroServidor(err, 'Não foi possível aprovar a imagem — o link de origem pode ter caído.');
      }
    });
  }

  rejeitar(item: ImagemCandidata) {
    this.alterarStatus(item, this.STATUS.REJEITADA, 'Imagem rejeitada.');
  }

  reabrir(item: ImagemCandidata) {
    this.alterarStatus(item, this.STATUS.PENDENTE, 'Imagem reaberta para revisão.');
  }

  private alterarStatus(item: ImagemCandidata, status: number, mensagemSucesso: string) {
    this.processandoId.set(item.id);
    this.produtosService.alterarStatusImagemCandidata(item.id, status).subscribe({
      next: () => {
        this.processandoId.set(null);
        this.toast.sucesso(mensagemSucesso);
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.processandoId.set(null);
        this.toast.erroServidor(err, 'Não foi possível alterar o status da imagem.');
      }
    });
  }

  rotuloStatus(status: number): string {
    const mapa: Record<number, string> = { 0: 'Pendente', 1: 'Aprovada', 2: 'Rejeitada' };
    return mapa[status] ?? String(status);
  }

  classeStatus(status: number): string {
    const mapa: Record<number, string> = {
      0: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      2: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
    };
    return mapa[status] ?? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  }
}
