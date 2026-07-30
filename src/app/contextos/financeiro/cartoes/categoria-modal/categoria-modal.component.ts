import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartoesService } from '../services/cartoes.service';
import { CategoriaDespesa } from '../models/categoria-despesa.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-categoria-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './categoria-modal.component.html'
})
export class CategoriaModalComponent implements OnInit {
  fechar = output<void>();

  private service = inject(CartoesService);
  private toast = inject(ToastService);

  categorias = signal<CategoriaDespesa[]>([]);
  novaCategoria = '';
  salvando  = signal(false);

  editandoId    = signal<number | null>(null);
  nomeEdicao    = '';
  excluindoId   = signal<number | null>(null);
  confirmandoId = signal<number | null>(null);

  readonly tamanhoPagina = 8;
  pagina = signal(1);

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.categorias().length / this.tamanhoPagina)));
  categoriasPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.tamanhoPagina;
    return this.categorias().slice(inicio, inicio + this.tamanhoPagina);
  });

  ngOnInit() {
    this.service.listarCategorias().subscribe({
      next: res => this.categorias.set(res.dados ?? []),
      error: err => this.toast.erroServidor(err, 'Erro ao carregar categorias.')
    });
  }

  irPara(p: number) {
    this.pagina.set(Math.min(Math.max(1, p), this.totalPaginas()));
  }

  adicionar() {
    if (!this.novaCategoria.trim()) return;
    this.salvando.set(true);
    this.service.criarCategoria(this.novaCategoria.trim()).subscribe({
      next: res => {
        this.categorias.update(list => [...list, res.dados!]);
        this.novaCategoria = '';
        this.salvando.set(false);
        this.irPara(this.totalPaginas());
        this.toast.sucesso('Categoria criada');
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Erro ao criar categoria.');
      }
    });
  }

  iniciarEdicao(cat: CategoriaDespesa) {
    this.editandoId.set(cat.id);
    this.nomeEdicao = cat.nome;
  }

  cancelarEdicao() {
    this.editandoId.set(null);
    this.nomeEdicao = '';
  }

  salvarEdicao() {
    const id = this.editandoId();
    const nome = this.nomeEdicao.trim();
    if (id === null || !nome) return;
    this.salvando.set(true);
    this.service.atualizarCategoria(id, nome).subscribe({
      next: res => {
        this.categorias.update(list => list.map(c => c.id === id ? (res.dados ?? { ...c, nome }) : c));
        this.cancelarEdicao();
        this.salvando.set(false);
        this.toast.sucesso('Categoria atualizada');
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Erro ao atualizar categoria.');
      }
    });
  }

  solicitarExclusao(cat: CategoriaDespesa) {
    this.confirmandoId.set(cat.id);
  }

  cancelarExclusao() {
    this.confirmandoId.set(null);
  }

  excluir(cat: CategoriaDespesa) {
    this.confirmandoId.set(null);
    this.excluindoId.set(cat.id);
    this.service.excluirCategoria(cat.id).subscribe({
      next: () => {
        this.categorias.update(list => list.filter(c => c.id !== cat.id));
        this.excluindoId.set(null);
        this.irPara(this.pagina());
        this.toast.sucesso('Categoria excluída');
      },
      error: err => {
        this.excluindoId.set(null);
        this.toast.erroServidor(err, 'Erro ao excluir categoria.');
      }
    });
  }
}
