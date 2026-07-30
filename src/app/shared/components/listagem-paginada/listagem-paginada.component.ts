import { Component, ContentChild, TemplateRef, input, output } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-listagem-paginada',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet],
  templateUrl: './listagem-paginada.component.html',
  host: { class: 'block' }
})
export class ListagemPaginadaComponent<T> {
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
