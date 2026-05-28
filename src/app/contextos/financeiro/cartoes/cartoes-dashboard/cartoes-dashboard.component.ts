import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartoesService } from '../services/cartoes.service';
import { FaturasService } from '../services/faturas.service';
import { Cartao } from '../models/cartao.model';
import { Fatura } from '../models/fatura.model';
import { CartaoModalComponent } from '../cartao-modal/cartao-modal.component';
import { CategoriaModalComponent } from '../categoria-modal/categoria-modal.component';

@Component({
  selector: 'app-cartoes-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CartaoModalComponent, CategoriaModalComponent],
  templateUrl: './cartoes-dashboard.component.html'
})
export class CartoesDashboardComponent implements OnInit {
  cartoes   = signal<Cartao[]>([]);
  faturas   = signal<Fatura[]>([]);
  carregando = signal(true);

  mostrarModalCartao    = signal(false);
  mostrarModalCategoria = signal(false);
  cartaoEmEdicao        = signal<Cartao | null>(null);

  totalGasto = computed(() =>
    this.faturas().filter(f => f.status !== 3).reduce((s, f) => s + f.valorTotal, 0)
  );

  totalCompras = computed(() => this.faturas().filter(f => f.status !== 3).length);

  limiteTotalGlobal = computed(() =>
    this.cartoes().reduce((s, c) => s + c.limiteTotal, 0)
  );

  limiteUsadoGlobal = computed(() =>
    this.cartoes().reduce((s, c) => s + c.limiteUsado, 0)
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
    const ids = this.cartoes().map(c => c.id);
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
    this.mostrarModalCartao.set(true);
  }

  fecharModalCartao(recarregar: boolean) {
    this.mostrarModalCartao.set(false);
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
    if (perc >= 90) return 'from-rose-500 to-red-600';
    if (perc >= 70) return 'from-amber-400 to-orange-500';
    return 'from-sky-500 to-blue-600';
  }

  labelStatus(status: number): string {
    return ['', 'Aberta', 'Processada', 'Paga'][status] ?? '-';
  }

  classeStatus(status: number): string {
    const mapa: Record<number, string> = {
      1: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      2: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
      3: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
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
