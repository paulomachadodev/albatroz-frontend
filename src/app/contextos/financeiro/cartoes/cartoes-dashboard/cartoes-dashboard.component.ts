import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartoesService } from '../services/cartoes.service';
import { FaturasService } from '../services/faturas.service';
import { Cartao } from '../models/cartao.model';
import { Fatura } from '../models/fatura.model';
import { CartaoModalComponent } from '../cartao-modal/cartao-modal.component';
import { CategoriaModalComponent } from '../categoria-modal/categoria-modal.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-cartoes-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CartaoModalComponent, CategoriaModalComponent, PageHeaderComponent, SpinnerComponent],
  templateUrl: './cartoes-dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class CartoesDashboardComponent implements OnInit {
  cartoes   = signal<Cartao[]>([]);
  faturas   = signal<Fatura[]>([]);
  carregando = signal(true);

  mostrarModalCartao    = signal(false);
  mostrarModalCategoria = signal(false);
  cartaoEmEdicao        = signal<Cartao | null>(null);
  principalPreSelecionado = signal<number | null>(null);

  // API retorna só principais com adicionais aninhados; achatado p/ contagens e faturas
  todosCartoes = computed<Cartao[]>(() =>
    this.cartoes().flatMap(c => [c, ...(c.adicionais ?? [])])
  );

  totalGasto = computed(() =>
    this.faturas().filter(f => f.status !== 3).reduce((s, f) => s + f.valorTotal, 0)
  );

  totalCompras = computed(() => this.faturas().filter(f => f.status !== 3).length);

  limiteTotalGlobal = computed(() =>
    this.todosCartoes().reduce((s, c) => s + c.limiteTotal, 0)
  );

  limiteUsadoGlobal = computed(() =>
    this.todosCartoes().reduce((s, c) => s + c.limiteUsado, 0)
  );

  percentualUso = computed(() => {
    const total = this.limiteTotalGlobal();
    return total > 0 ? (this.limiteUsadoGlobal() / total) * 100 : 0;
  });

  faturasPorStatus = computed(() => ({
    abertas:     this.faturas().filter(f => f.status === 1).length,
    processadas: this.faturas().filter(f => f.status === 2).length,
    pagas:       this.faturas().filter(f => f.status === 3).length
  }));

  constructor(
    private cartoesService: CartoesService,
    private faturasService: FaturasService
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  private carregarDados() {
    this.carregando.set(true);
    this.cartoesService.listar().subscribe({
      next: res => {
        this.cartoes.set(res.dados ?? []);
        this.carregarFaturas();
      },
      error: () => this.carregando.set(false)
    });
  }

  private carregarFaturas() {
    const ids = this.todosCartoes().map(c => c.id);
    if (!ids.length) { this.carregando.set(false); return; }

    const faturasTodas: Fatura[] = [];
    let pendentes = ids.length;

    ids.forEach(id => {
      this.faturasService.listarPorCartao(id).subscribe({
        next: res => {
          faturasTodas.push(...(res.dados ?? []));
          if (--pendentes === 0) {
            this.faturas.set(faturasTodas.sort((a, b) =>
              b.anoReferencia !== a.anoReferencia
                ? b.anoReferencia - a.anoReferencia
                : b.mesReferencia - a.mesReferencia
            ));
            this.carregando.set(false);
          }
        },
        error: () => { if (--pendentes === 0) this.carregando.set(false); }
      });
    });
  }

  abrirModalCartao(cartao?: Cartao) {
    this.cartaoEmEdicao.set(cartao ?? null);
    this.principalPreSelecionado.set(null);
    this.mostrarModalCartao.set(true);
  }

  abrirModalAdicional(principal: Cartao) {
    this.cartaoEmEdicao.set(null);
    this.principalPreSelecionado.set(principal.id);
    this.mostrarModalCartao.set(true);
  }

  fecharModalCartao(recarregar: boolean) {
    this.mostrarModalCartao.set(false);
    this.principalPreSelecionado.set(null);
    if (recarregar) this.carregarDados();
  }

  fecharModalCategoria() {
    this.mostrarModalCategoria.set(false);
  }

  percCartao(cartao: Cartao): number {
    return cartao.limiteTotal > 0
      ? Math.min((cartao.limiteUsado / cartao.limiteTotal) * 100, 100)
      : 0;
  }

  corBarra(perc: number): string {
    if (perc >= 90) return 'bg-rose-500';
    if (perc >= 70) return 'bg-amber-500';
    return 'bg-primary';
  }

  labelStatus(status: number): string {
    return ['', 'Aberta', 'Processada', 'Paga'][status] ?? '-';
  }

  classeStatus(status: number): string {
    const mapa: Record<number, string> = {
      1: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
    };
    return mapa[status] ?? '';
  }

  formatarMes(mes: number, ano: number): string {
    return new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
