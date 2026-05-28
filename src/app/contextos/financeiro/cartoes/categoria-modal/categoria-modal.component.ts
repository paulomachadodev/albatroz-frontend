import { Component, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartoesService } from '../services/cartoes.service';
import { CategoriaDespesa } from '../models/categoria-despesa.model';

@Component({
  selector: 'app-categoria-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-modal.component.html'
})
export class CategoriaModalComponent implements OnInit {
  fechar = output<void>();

  categorias = signal<CategoriaDespesa[]>([]);
  novaCategoria = '';
  salvando  = signal(false);
  erro      = signal<string | null>(null);

  constructor(private service: CartoesService) {}

  ngOnInit() {
    this.service.listarCategorias().subscribe({
      next: res => this.categorias.set(res.dados ?? [])
    });
  }

  adicionar() {
    if (!this.novaCategoria.trim()) return;
    this.salvando.set(true);
    this.erro.set(null);
    this.service.criarCategoria(this.novaCategoria.trim()).subscribe({
      next: res => {
        this.categorias.update(list => [...list, res.dados!]);
        this.novaCategoria = '';
        this.salvando.set(false);
      },
      error: err => {
        this.erro.set(err?.error?.mensagem ?? 'Erro ao criar categoria.');
        this.salvando.set(false);
      }
    });
  }
}
