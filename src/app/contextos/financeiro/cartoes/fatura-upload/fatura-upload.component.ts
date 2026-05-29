import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CartoesService } from '../services/cartoes.service';
import { FaturasService } from '../services/faturas.service';
import { Cartao } from '../models/cartao.model';
import { CategoriaDespesa } from '../models/categoria-despesa.model';
import { DespesaCartao, ParcelaProjetada } from '../models/despesa-cartao.model';
import { ExtrairFaturaResposta } from '../dtos/despesa-cartao-salvar.dto';
import { ProjecaoModalComponent } from '../projecao-modal/projecao-modal.component';
import { CategoriaSelectComponent } from '../categoria-select/categoria-select.component';

@Component({
  selector: 'app-fatura-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProjecaoModalComponent, CategoriaSelectComponent],
  templateUrl: './fatura-upload.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class FaturaUploadComponent implements OnInit, OnDestroy {
  protected Math = Math;
  cartoes     = signal<Cartao[]>([]);
  categorias  = signal<CategoriaDespesa[]>([]);
  despesas    = signal<DespesaCartao[]>([]);
  cabecalho   = signal<Partial<ExtrairFaturaResposta> | null>(null);

  cartaoSelecionado = signal<number | null>(null);
  arquivo           = signal<File | null>(null);
  arrastando        = signal(false);
  extraindo         = signal(false);
  statusExtracao    = signal<'idle' | 'enviando' | 'processando' | 'concluido' | 'erro'>('idle');
  salvando          = signal(false);
  erro              = signal<string | null>(null);

  mostrarProjecao   = signal(false);
  parcelasNovas     = signal<ParcelaProjetada[]>([]);

  private jobId: string | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  totalGrid = computed(() =>
    this.despesas().reduce((s, d) => s + (d.valor ?? 0), 0)
  );

  divergencia = computed(() => {
    const cab = this.cabecalho();
    if (!cab?.valorTotal) return null;
    const diff = cab.valorTotal - this.totalGrid();
    return Math.abs(diff) > 0.01 ? diff : null;
  });

  constructor(
    private cartoesService: CartoesService,
    private faturasService: FaturasService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cartoesService.listar().subscribe({ next: r => this.cartoes.set(r.dados ?? []) });
    this.cartoesService.listarCategorias().subscribe({ next: r => this.categorias.set(r.dados ?? []) });
  }

  ngOnDestroy() {
    this.pararPolling();
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.arrastando.set(true); }
  onDragLeave()            { this.arrastando.set(false); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.arrastando.set(false);
    const f = e.dataTransfer?.files[0];
    if (f && f.type === 'application/pdf') this.arquivo.set(f);
    else this.erro.set('Apenas arquivos PDF são aceitos.');
  }

  onFileInput(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.arquivo.set(f);
  }

  extrair() {
    const cartaoId = this.cartaoSelecionado();
    const arq      = this.arquivo();
    if (!cartaoId || !arq) { this.erro.set('Selecione o cartão e o arquivo PDF.'); return; }

    this.statusExtracao.set('enviando');
    this.extraindo.set(true);
    this.erro.set(null);

    this.faturasService.enfileirarExtracao(cartaoId, arq).subscribe({
      next: res => {
        this.jobId = res.dados!.jobId;
        this.statusExtracao.set('processando');
        this.iniciarPolling();
      },
      error: err => {
        this.erro.set(err?.error?.mensagem ?? 'Erro ao enviar PDF.');
        this.statusExtracao.set('idle');
        this.extraindo.set(false);
      }
    });
  }

  private iniciarPolling() {
    this.pollingInterval = setInterval(() => {
      if (!this.jobId) return;
      this.faturasService.consultarExtracao(this.jobId).subscribe({
        next: res => {
          const status = res.dados!;
          if (status.status === 'concluido') {
            this.pararPolling();
            const dados = status.resultado!;
            this.cabecalho.set(dados);
            this.despesas.set(dados.despesas.map(d => ({
              ...d,
              idFatura: 0,
              valor: parseFloat((d.valor ?? 0).toFixed(2))
            })));
            this.statusExtracao.set('concluido');
            this.extraindo.set(false);
          } else if (status.status === 'erro') {
            this.pararPolling();
            this.erro.set(status.erro ?? 'Erro na extração via Albia.');
            this.statusExtracao.set('erro');
            this.extraindo.set(false);
          }
        },
        error: () => {
          this.pararPolling();
          this.erro.set('Erro ao consultar status da extração.');
          this.statusExtracao.set('erro');
          this.extraindo.set(false);
        }
      });
    }, 3000);
  }

  private pararPolling() {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  adicionarLinha() {
    const cartaoId = this.cartaoSelecionado() ?? 0;
    this.despesas.update(list => [...list, {
      idFatura: 0,
      dataCompra: new Date().toISOString().split('T')[0],
      descricaoOriginal: '',
      valor: 0,
      parcelaAtual: 1,
      totalParcelas: 1,
      origem: 3,
      status: 1
    }]);
  }

  removerLinha(i: number) {
    this.despesas.update(list => list.filter((_, idx) => idx !== i));
  }

  criarCategoria(nome: string, d: DespesaCartao) {
    this.cartoesService.criarCategoria(nome).subscribe({
      next: res => {
        const cat = res.dados!;
        this.categorias.update(list => [...list, cat]);
        d.idCategoriaDespesa = cat.id;
        this.despesas.update(list => [...list]);
      },
      error: err => this.erro.set(err?.error?.mensagem ?? 'Erro ao criar categoria.')
    });
  }

  salvar() {
    const parceladas = this.despesas().filter(d => d.totalParcelas > 1 && d.parcelaAtual === 1);
    if (parceladas.length > 0) {
      this.parcelasNovas.set(parceladas.map(d => ({
        descricaoOriginal: d.descricaoOriginal,
        valor: d.valor,
        parcelaAtual: d.parcelaAtual,
        totalParcelas: d.totalParcelas,
        selecionada: true,
        parcelas: []
      })));
      this.mostrarProjecao.set(true);
      return;
    }
    this.executarSalvamento([]);
  }

  confirmarProjecao(projecoes: ParcelaProjetada[]) {
    this.mostrarProjecao.set(false);
    this.executarSalvamento(projecoes);
  }

  private executarSalvamento(projecoes: ParcelaProjetada[]) {
    this.salvando.set(true);
    this.faturasService.salvarDespesas(0, { despesas: this.despesas(), projecoes }).subscribe({
      next: () => { this.salvando.set(false); this.router.navigate(['..'], { relativeTo: this.route }); },
      error: err => {
        this.erro.set(err?.error?.mensagem ?? 'Erro ao salvar despesas.');
        this.salvando.set(false);
      }
    });
  }

  normalizarValor(d: DespesaCartao) {
    d.valor = parseFloat(((d.valor ?? 0)).toFixed(2));
  }

  formatarReais(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  nomeCat(id?: number): string {
    return this.categorias().find(c => c.id === id)?.nome ?? '—';
  }
}
