import { Component, OnInit, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotasEntradaService } from '../../services/notas-entrada.service';
import { ConferenciaNotaResposta, ConferenciaItemResposta } from '../../models/nota-entrada.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';

interface EstadoItem {
  descricaoConferida: string;
  fatorConversao: number;
  salvando: boolean;
  alterado: boolean;
}

@Component({
  selector: 'app-nota-entrada-conferencia',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './nota-entrada-conferencia.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class NotaEntradaConferenciaComponent implements OnInit {
  carregando = signal(true);
  nota = signal<ConferenciaNotaResposta | null>(null);
  confirmando = signal(false);
  registrandoChegada = signal(false);

  estadoItens = new Map<number, EstadoItem>();

  constructor(
    private service: NotasEntradaService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregar();
  }

  get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  carregar() {
    this.carregando.set(true);
    this.service.obterConferencia(this.id).subscribe({
      next: res => {
        const n = res.dados ?? null;
        this.nota.set(n);
        if (n) this.inicializarEstados(n.itens);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar a conferência.');
        this.carregando.set(false);
      }
    });
  }

  private inicializarEstados(itens: ConferenciaItemResposta[]) {
    this.estadoItens.clear();
    for (const item of itens) {
      this.estadoItens.set(item.id, {
        descricaoConferida: item.descricaoConferida ?? item.descricaoNota ?? '',
        fatorConversao: item.fatorConversao || 1,
        salvando: false,
        alterado: false
      });
    }
  }

  estadoItem(id: number): EstadoItem {
    return this.estadoItens.get(id)!;
  }

  quantidadeEstoqueCalculada(item: ConferenciaItemResposta): number {
    const estado = this.estadoItens.get(item.id);
    const fator = estado?.fatorConversao || 1;
    return fator > 0 ? item.quantidadeNota / fator : item.quantidadeNota;
  }

  marcarAlterado(id: number) {
    const e = this.estadoItens.get(id);
    if (e) e.alterado = true;
  }

  salvarItem(item: ConferenciaItemResposta) {
    const estado = this.estadoItens.get(item.id);
    if (!estado) return;
    if (estado.fatorConversao <= 0) {
      this.toast.erro('Fator de conversão deve ser maior que zero.');
      return;
    }
    estado.salvando = true;
    const qtdEstoque = item.quantidadeNota / estado.fatorConversao;
    this.service.atualizarItemConferencia(this.id, item.id, {
      descricaoConferida: estado.descricaoConferida || null,
      fatorConversao: estado.fatorConversao,
      quantidadeEstoque: Math.round(qtdEstoque * 1000) / 1000
    }).subscribe({
      next: () => {
        estado.salvando = false;
        estado.alterado = false;
        this.toast.sucesso('Item atualizado.');
      },
      error: err => {
        estado.salvando = false;
        const msg = err?.error?.erro ?? 'Não foi possível salvar o item.';
        this.toast.erro(msg);
      }
    });
  }

  registrarChegada() {
    this.registrandoChegada.set(true);
    this.service.registrarChegada(this.id).subscribe({
      next: () => {
        this.registrandoChegada.set(false);
        this.toast.sucesso('Mercadoria registrada como chegou.');
        this.carregar();
      },
      error: err => {
        this.registrandoChegada.set(false);
        const msg = err?.error?.erro ?? 'Não foi possível registrar a chegada.';
        this.toast.erro(msg);
      }
    });
  }

  confirmarEntrada() {
    this.confirmando.set(true);
    this.service.confirmar(this.id).subscribe({
      next: () => {
        this.confirmando.set(false);
        this.toast.sucesso('Entrada confirmada! Estoque e contas a pagar atualizados.');
        this.router.navigate(['/compras/notas-entrada', this.id]);
      },
      error: err => {
        this.confirmando.set(false);
        const msg = err?.error?.erro ?? 'Não foi possível confirmar a entrada.';
        this.toast.erro(msg);
      }
    });
  }

  podeConfirmar(): boolean {
    const n = this.nota();
    if (!n || n.status === 3 || n.status === 4) return false;
    return n.itens.every(i => i.statusMatch !== 1);
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
      default: return 'bg-slate-100 text-slate-500';
    }
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

  formatarReais(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarNumero(valor: number, casas = 3): string {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  formatarData(valor: string | null): string {
    if (!valor) return '-';
    try { return formatDate(valor, 'dd/MM/yyyy', 'pt-BR'); } catch { return '-'; }
  }

  formatarDataHora(valor: string | null): string {
    if (!valor) return '-';
    try { return formatDate(valor, 'dd/MM/yyyy HH:mm', 'pt-BR'); } catch { return '-'; }
  }

  voltar() {
    this.router.navigate(['/compras/notas-entrada', this.id]);
  }
}
