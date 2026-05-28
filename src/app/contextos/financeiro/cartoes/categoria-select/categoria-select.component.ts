import { Component, ElementRef, HostListener, computed, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaDespesa } from '../models/categoria-despesa.model';

@Component({
  selector: 'app-categoria-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-select.component.html'
})
export class CategoriaSelectComponent {
  private host = inject(ElementRef<HTMLElement>);

  categorias = input<CategoriaDespesa[]>([]);
  value      = model<number | undefined>(undefined);
  criar      = output<string>();

  aberto = signal(false);
  busca  = signal('');

  selecionada = computed(() =>
    this.categorias().find(c => c.id === this.value())
  );

  filtradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) return this.categorias();
    return this.categorias().filter(c => c.nome.toLowerCase().includes(termo));
  });

  podeCriar = computed(() => {
    const termo = this.busca().trim();
    if (!termo) return false;
    return !this.categorias().some(c => c.nome.toLowerCase() === termo.toLowerCase());
  });

  abrir() {
    this.aberto.set(true);
    this.busca.set('');
  }

  fechar() {
    this.aberto.set(false);
    this.busca.set('');
  }

  selecionar(cat: CategoriaDespesa) {
    this.value.set(cat.id);
    this.fechar();
  }

  limpar() {
    this.value.set(undefined);
    this.fechar();
  }

  criarNova() {
    const termo = this.busca().trim();
    if (!termo) return;
    this.criar.emit(termo);
    this.fechar();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (this.aberto() && !this.host.nativeElement.contains(e.target)) this.fechar();
  }
}
