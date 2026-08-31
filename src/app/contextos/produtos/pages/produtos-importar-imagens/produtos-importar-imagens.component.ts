import { Component, computed, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { ProdutosService } from '../../services/produtos.service';
import { ProdutoImportarImagensCorrespondido, ProdutoImportarImagensResposta } from '../../dtos/produto-resposta.dto';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { OverlayProgressoComponent } from '../../../../shared/components/overlay-progresso/overlay-progresso.component';

@Component({
  selector: 'app-produtos-importar-imagens',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, ListagemPaginadaComponent, OverlayProgressoComponent],
  templateUrl: './produtos-importar-imagens.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosImportarImagensComponent {
  modo = signal<'codigo_produto' | 'codigo_fornecedor'>('codigo_produto');

  arquivos = signal<File[]>([]);
  arrastandoSobreZona = signal(false);
  processandoPreview = signal(false);
  confirmandoImportacao = signal(false);
  resultadoPreview = signal<ProdutoImportarImagensResposta | null>(null);
  resultadoFinal = signal<ProdutoImportarImagensResposta | null>(null);

  paginaAtual = signal(1);
  tamanhoPagina = signal(10);

  correspondidosPagina = computed(() => {
    const resultado = this.resultadoFinal() ?? this.resultadoPreview();
    const todos = resultado?.correspondidos ?? [];
    const inicio = (this.paginaAtual() - 1) * this.tamanhoPagina();
    return todos.slice(inicio, inicio + this.tamanhoPagina());
  });

  importadosComSucesso = computed(() =>
    (this.resultadoFinal()?.correspondidos ?? []).filter(i => !i.erro).length);

  ignorados = computed(() =>
    (this.resultadoFinal()?.correspondidos ?? []).filter(i => !!i.erro));

  totalPaginas = computed(() => {
    const resultado = this.resultadoFinal() ?? this.resultadoPreview();
    const total = resultado?.correspondidos.length ?? 0;
    return Math.max(1, Math.ceil(total / this.tamanhoPagina()));
  });

  constructor(
    private produtosService: ProdutosService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private router: Router
  ) {}

  voltar() {
    this.router.navigate(['/produtos']);
  }

  aoMudarModo(modo: 'codigo_produto' | 'codigo_fornecedor') {
    this.modo.set(modo);
    if (this.arquivos().length > 0) this.gerarPreview();
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
    this.paginaAtual.set(1);
    this.gerarPreview();
  }

  limpar() {
    this.arquivos.set([]);
    this.resultadoPreview.set(null);
    this.resultadoFinal.set(null);
    this.paginaAtual.set(1);
  }

  // Remoção é só local (o preview já sabe o que casou com o quê) — nunca reprocessa o lote
  // inteiro no servidor de novo só pra tirar 1 arquivo, isso é que deixava lento.
  async excluirDoLote(item: ProdutoImportarImagensCorrespondido) {
    const confirmado = await this.confirm.confirmar(
      `Excluir "${item.nomeArquivo}" do lote?`,
      'Esse arquivo não será enviado nessa importação.',
      { textoConfirmar: 'Excluir' }
    );
    if (!confirmado) return;

    this.arquivos.set(this.arquivos().filter(a => a.name !== item.nomeArquivo));
    if (this.arquivos().length === 0) {
      this.limpar();
      return;
    }

    const atual = this.resultadoPreview();
    if (atual) {
      this.resultadoPreview.set({
        ...atual,
        correspondidos: atual.correspondidos.filter(c => c.nomeArquivo !== item.nomeArquivo)
      });
    }
  }

  aoMudarPagina(pagina: number) {
    this.paginaAtual.set(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.paginaAtual.set(1);
  }

  // Cloudflare (proxy da api-erp) rejeita upload com mais de 100MB antes de chegar no
  // servidor, mesmo o backend aceitando até 200MB — lote grande (ex: 107 imagens) estourava
  // isso. Divide em sub-lotes por tamanho acumulado, bem abaixo do limite, e envia em
  // sequência, juntando os resultados como se fosse uma request só.
  private static readonly TAMANHO_MAXIMO_LOTE_BYTES = 60 * 1024 * 1024; // 60MB, margem folgada sob os 100MB do Cloudflare

  private dividirEmLotes(arquivos: File[]): File[][] {
    const lotes: File[][] = [];
    let loteAtual: File[] = [];
    let tamanhoAtual = 0;

    for (const arquivo of arquivos) {
      if (loteAtual.length > 0 && tamanhoAtual + arquivo.size > ProdutosImportarImagensComponent.TAMANHO_MAXIMO_LOTE_BYTES) {
        lotes.push(loteAtual);
        loteAtual = [];
        tamanhoAtual = 0;
      }
      loteAtual.push(arquivo);
      tamanhoAtual += arquivo.size;
    }
    if (loteAtual.length > 0) lotes.push(loteAtual);
    return lotes;
  }

  private processandoLote = signal<{ atual: number; total: number } | null>(null);
  readonly progressoLotes = this.processandoLote.asReadonly();

  private executarEmLotes(confirmar: boolean, aoConcluir: (res: ProdutoImportarImagensResposta) => void, aoErro: (err: unknown) => void) {
    const lotes = this.dividirEmLotes(this.arquivos());
    const acumulado: ProdutoImportarImagensResposta = { confirmado: confirmar, correspondidos: [], semCorrespondencia: [] };

    const proximo = (indice: number) => {
      if (indice >= lotes.length) {
        this.processandoLote.set(null);
        aoConcluir(acumulado);
        return;
      }

      this.processandoLote.set({ atual: indice + 1, total: lotes.length });
      this.produtosService.importarImagensLote(lotes[indice], confirmar, this.modo()).subscribe({
        next: res => {
          if (res.dados) {
            acumulado.correspondidos.push(...res.dados.correspondidos);
            acumulado.semCorrespondencia.push(...res.dados.semCorrespondencia);
          }
          proximo(indice + 1);
        },
        error: err => {
          this.processandoLote.set(null);
          aoErro(err);
        }
      });
    };

    proximo(0);
  }

  private gerarPreview() {
    if (this.arquivos().length === 0) return;

    this.processandoPreview.set(true);
    this.executarEmLotes(
      false,
      res => { this.resultadoPreview.set(res); this.processandoPreview.set(false); },
      err => { this.processandoPreview.set(false); this.toast.erroServidor(err, 'Não foi possível processar os arquivos.'); }
    );
  }

  confirmarImportacao() {
    if (this.arquivos().length === 0) return;

    this.confirmandoImportacao.set(true);
    this.executarEmLotes(
      true,
      res => {
        this.resultadoFinal.set(res);
        this.confirmandoImportacao.set(false);
        this.paginaAtual.set(1);
        this.toast.sucesso('Importação concluída.');
      },
      err => { this.confirmandoImportacao.set(false); this.toast.erroServidor(err, 'Não foi possível confirmar a importação.'); }
    );
  }
}
