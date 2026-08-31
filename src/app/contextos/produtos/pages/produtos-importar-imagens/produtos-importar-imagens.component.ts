import { Component, computed, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { ProdutosService } from '../../services/produtos.service';
import { ProdutoImportarImagensCorrespondido, ProdutoImportarImagensResposta } from '../../dtos/produto-resposta.dto';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { OverlayProgressoComponent } from '../../../../shared/components/overlay-progresso/overlay-progresso.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';

interface ResumoImportacao {
  sucesso: number;
  ignoradas: ProdutoImportarImagensCorrespondido[];
  semCorrespondencia: string[];
}

@Component({
  selector: 'app-produtos-importar-imagens',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, ListagemPaginadaComponent, OverlayProgressoComponent, ToggleComponent, DrawerComponent],
  templateUrl: './produtos-importar-imagens.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ProdutosImportarImagensComponent {
  modo = signal<'codigo_produto' | 'codigo_fornecedor'>('codigo_fornecedor');
  pularSeJaTemImagem = signal(true);

  arquivos = signal<File[]>([]);
  arrastandoSobreZona = signal(false);
  processandoPreview = signal(false);
  confirmandoImportacao = signal(false);
  resultadoPreview = signal<ProdutoImportarImagensResposta | null>(null);

  // Resumo fica visível depois de confirmar, mesmo com a tela limpa pra receber o próximo
  // lote — só reseta quando um novo arquivo é selecionado (definirArquivos).
  resumoImportacao = signal<ResumoImportacao | null>(null);
  drawerIgnoradasAberto = signal(false);
  drawerSemCorrespondenciaAberto = signal(false);

  paginaAtual = signal(1);
  tamanhoPagina = signal(10);

  correspondidosPagina = computed(() => {
    const todos = this.resultadoPreview()?.correspondidos ?? [];
    const inicio = (this.paginaAtual() - 1) * this.tamanhoPagina();
    return todos.slice(inicio, inicio + this.tamanhoPagina());
  });

  totalPaginas = computed(() => {
    const total = this.resultadoPreview()?.correspondidos.length ?? 0;
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

  aoMudarPularSeJaTemImagem(valor: boolean) {
    this.pularSeJaTemImagem.set(valor);
    if (this.arquivos().length > 0) this.gerarPreview();
  }

  qtdJaTinhaImagem = computed(() =>
    new Set((this.resultadoPreview()?.correspondidos ?? [])
      .filter(i => i.produtoJaTinhaImagem)
      .map(i => i.idProduto)).size);

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
    this.resumoImportacao.set(null);
    this.paginaAtual.set(1);
    this.gerarPreview();
  }

  limpar() {
    this.arquivos.set([]);
    this.resultadoPreview.set(null);
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

  abrirDrawerIgnoradas() {
    if ((this.resumoImportacao()?.ignoradas.length ?? 0) === 0) return;
    this.drawerIgnoradasAberto.set(true);
  }

  abrirDrawerSemCorrespondencia() {
    if ((this.resumoImportacao()?.semCorrespondencia.length ?? 0) === 0) return;
    this.drawerSemCorrespondenciaAberto.set(true);
  }

  aoMudarPagina(pagina: number) {
    this.paginaAtual.set(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.paginaAtual.set(1);
  }

  // Cloudflare (proxy da api-erp) tem dois limites que batem aqui: 100MB de corpo de
  // requisição E ~100s de timeout de gateway por requisição. O primeiro já tinha sido
  // resolvido limitando por tamanho, mas um lote com muitos arquivos pequenos (o cap de
  // bytes nunca estoura) ainda demorava demais na CONFIRMAÇÃO — cada arquivo passa por
  // conversão WebP + upload R2 + escrita no banco, em sequência, e isso sozinho já passa
  // dos 100s antes do corpo se aproximar de 100MB. Por isso limita também por quantidade
  // de arquivos, não só por bytes.
  private static readonly TAMANHO_MAXIMO_LOTE_BYTES = 40 * 1024 * 1024; // 40MB
  private static readonly MAXIMO_ARQUIVOS_POR_LOTE = 15;

  private dividirEmLotes(arquivos: File[]): File[][] {
    const lotes: File[][] = [];
    let loteAtual: File[] = [];
    let tamanhoAtual = 0;

    for (const arquivo of arquivos) {
      const estourouLimite = loteAtual.length > 0 && (
        tamanhoAtual + arquivo.size > ProdutosImportarImagensComponent.TAMANHO_MAXIMO_LOTE_BYTES ||
        loteAtual.length >= ProdutosImportarImagensComponent.MAXIMO_ARQUIVOS_POR_LOTE
      );
      if (estourouLimite) {
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
      this.produtosService.importarImagensLote(lotes[indice], confirmar, this.modo(), this.pularSeJaTemImagem()).subscribe({
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
        this.confirmandoImportacao.set(false);
        this.resumoImportacao.set({
          sucesso: res.correspondidos.filter(i => !i.erro).length,
          ignoradas: res.correspondidos.filter(i => !!i.erro),
          semCorrespondencia: res.semCorrespondencia
        });
        this.toast.sucesso('Importado com sucesso!');
        this.limpar(); // tela pronta pro próximo lote — resumo continua visível até o próximo upload
      },
      err => { this.confirmandoImportacao.set(false); this.toast.erroServidor(err, 'Não foi possível confirmar a importação.'); }
    );
  }
}
