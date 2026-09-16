import { AfterViewInit, Component, ContentChild, ElementRef, TemplateRef, input, output, signal, viewChild } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';

const ALTURA_MAX_UMA_LINHA_PX = 100;

@Component({
  selector: 'app-listagem-paginada',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet],
  templateUrl: './listagem-paginada.component.html',
  host: { class: 'block' }
})
export class ListagemPaginadaComponent<T> implements AfterViewInit {
  itens = input.required<T[]>();
  carregando = input<boolean>(false);
  totalRegistros = input<number>(0);
  paginaAtual = input<number>(1);
  totalPaginas = input<number>(1);
  tamanhoPagina = input<number>(10);
  opcoesTamanhoPagina = input<number[]>([10, 50, 100]);
  tituloVazio = input<string>('Nenhum registro encontrado');

  paginaMudou = output<number>();
  tamanhoPaginaMudou = output<number>();

  @ContentChild('cabecalho', { read: TemplateRef }) cabecalhoTpl?: TemplateRef<unknown>;
  @ContentChild('linha', { read: TemplateRef }) linhaTpl!: TemplateRef<unknown>;
  @ContentChild('linhaMobile', { read: TemplateRef }) linhaMobileTpl?: TemplateRef<unknown>;

  filtrosWrapper = viewChild<ElementRef<HTMLDivElement>>('filtrosWrapper');
  filtrosExpandidos = signal(false);
  filtrosCabemNumaLinha = signal(false);

  ngAfterViewInit() {
    const altura = this.filtrosWrapper()?.nativeElement.scrollHeight ?? 0;
    this.filtrosCabemNumaLinha.set(altura > 0 && altura <= ALTURA_MAX_UMA_LINHA_PX);
  }

  alternarFiltros() {
    this.filtrosExpandidos.update(v => !v);
  }

  classeConteudoFiltros(): string {
    const desktopExpandido = this.filtrosCabemNumaLinha() || this.filtrosExpandidos();
    const mobileExpandido = this.filtrosExpandidos();
    return [
      'transition-all duration-200 overflow-hidden',
      mobileExpandido ? 'max-h-none opacity-100' : 'max-h-0 opacity-0',
      desktopExpandido ? 'md:max-h-none md:opacity-100 md:overflow-visible' : 'md:max-h-[84px] md:opacity-100'
    ].join(' ');
  }

  classeBotaoFiltros(): string {
    return this.filtrosCabemNumaLinha() ? 'flex justify-end mb-2 md:hidden' : 'flex justify-end mb-2';
  }

  paginaAnterior() {
    if (this.paginaAtual() > 1) this.paginaMudou.emit(this.paginaAtual() - 1);
  }

  proximaPagina() {
    if (this.paginaAtual() < this.totalPaginas()) this.paginaMudou.emit(this.paginaAtual() + 1);
  }

  aoMudarTamanho(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.tamanhoPaginaMudou.emit(Number(select.value));
  }
}
