import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotasEntradaService } from '../../services/notas-entrada.service';
import { NotaEntradaDetalhe, NotaEntradaItem, SugestaoDescricaoProduto } from '../../models/nota-entrada.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-nota-entrada-detalhe',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent, ModalComponent],
  templateUrl: './nota-entrada-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class NotaEntradaDetalheComponent implements OnInit {
  carregando = signal(true);
  nota = signal<NotaEntradaDetalhe | null>(null);

  processando = signal(false);
  calculando = signal(false);
  confirmando = signal(false);

  modalCriarProdutoAberto = signal(false);
  itemSelecionado = signal<NotaEntradaItem | null>(null);
  sugestao = signal<SugestaoDescricaoProduto | null>(null);
  carregandoSugestao = signal(false);
  descricaoProduto = '';
  criandoProduto = signal(false);

  constructor(
    private service: NotasEntradaService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar(id);
  }

  get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  carregar(id: number) {
    this.carregando.set(true);
    this.service.obter(id).subscribe({
      next: res => {
        this.nota.set(res.dados ?? null);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar a nota de entrada.');
        this.carregando.set(false);
      }
    });
  }

  processar() {
    const nota = this.nota();
    if (!nota) return;
    this.processando.set(true);
    this.service.matchar(nota.id).subscribe({
      next: () => {
        this.processando.set(false);
        this.toast.sucesso('Matching automático realizado.');
        this.carregar(nota.id);
      },
      error: err => {
        this.processando.set(false);
        this.toast.erroServidor(err, 'Não foi possível executar o matching.');
      }
    });
  }

  calcularCustos() {
    const nota = this.nota();
    if (!nota) return;
    this.calculando.set(true);
    this.service.calcularCusto(nota.id).subscribe({
      next: () => {
        this.calculando.set(false);
        this.toast.sucesso('Custos calculados com sucesso.');
        this.carregar(nota.id);
      },
      error: err => {
        this.calculando.set(false);
        this.toast.erroServidor(err, 'Não foi possível calcular os custos.');
      }
    });
  }

  confirmarEntrada() {
    const nota = this.nota();
    if (!nota) return;
    this.confirmando.set(true);
    this.service.confirmar(nota.id).subscribe({
      next: () => {
        this.confirmando.set(false);
        this.toast.sucesso('Entrada confirmada! Estoque e contas a pagar atualizados.');
        this.carregar(nota.id);
      },
      error: err => {
        this.confirmando.set(false);
        const mensagem = err?.error?.erro ?? 'Não foi possível confirmar a entrada.';
        this.toast.erro(mensagem);
      }
    });
  }

  abrirModalCriarProduto(item: NotaEntradaItem) {
    const nota = this.nota();
    if (!nota) return;
    this.itemSelecionado.set(item);
    this.descricaoProduto = item.descricaoNota ?? '';
    this.sugestao.set(null);
    this.modalCriarProdutoAberto.set(true);
    this.carregandoSugestao.set(true);
    this.service.obterSugestaoDescricao(nota.id, item.id).subscribe({
      next: res => {
        const sug = res.dados;
        if (sug) {
          this.sugestao.set(sug);
          this.descricaoProduto = sug.descricaoSugerida;
        }
        this.carregandoSugestao.set(false);
      },
      error: () => {
        this.carregandoSugestao.set(false);
      }
    });
  }

  fecharModalCriarProduto() {
    this.modalCriarProdutoAberto.set(false);
    this.itemSelecionado.set(null);
    this.sugestao.set(null);
  }

  confirmarCriacaoProduto() {
    const nota = this.nota();
    const item = this.itemSelecionado();
    if (!nota || !item) return;
    if (!this.descricaoProduto.trim()) {
      this.toast.erro('Informe a descrição do produto.');
      return;
    }
    this.criandoProduto.set(true);
    this.service.criarProduto(nota.id, item.id, this.descricaoProduto.trim()).subscribe({
      next: res => {
        this.criandoProduto.set(false);
        this.toast.sucesso(`Produto "${res.dados?.descricao}" criado e vinculado.`);
        this.fecharModalCriarProduto();
        this.carregar(nota.id);
      },
      error: err => {
        this.criandoProduto.set(false);
        const mensagem = err?.error?.erro ?? 'Não foi possível criar o produto.';
        this.toast.erro(mensagem);
      }
    });
  }

  podeProcesar(): boolean {
    const n = this.nota();
    return !!n && n.status !== 3 && n.status !== 4;
  }

  podeConfirmar(): boolean {
    const n = this.nota();
    if (!n) return false;
    if (n.status === 3 || n.status === 4) return false;
    return n.itens.every(i => i.statusMatch !== 1);
  }

  rotuloStatusMatch(status: number): string {
    const r: Record<number, string> = { 1: 'Pendente', 2: 'Auto', 3: 'Manual', 4: 'Novo', 5: 'Ignorado' };
    return r[status] ?? '-';
  }

  classeStatusMatch(status: number): string {
    switch (status) {
      case 1: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 2: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 3: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
      case 4: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 5: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-400';
    }
  }

  rotuloStatus(status: number): string {
    const r: Record<number, string> = { 1: 'Rascunho', 2: 'Conferindo', 3: 'Confirmada', 4: 'Cancelada', 5: 'Manifestada' };
    return r[status] ?? '-';
  }

  classeStatus(status: number): string {
    switch (status) {
      case 1: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
      case 2: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 3: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 4: return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      case 5: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-500';
    }
  }

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarNumero(valor: number, casas = 2): string {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  formatarData(valor: string | null): string {
    if (!valor) return '-';
    try { return formatDate(valor, 'dd/MM/yyyy', 'pt-BR'); } catch { return '-'; }
  }

  voltar() {
    this.router.navigate(['/compras/notas-entrada']);
  }
}
