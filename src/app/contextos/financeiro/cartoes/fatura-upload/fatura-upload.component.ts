import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartoesService } from '../services/cartoes.service';
import { FaturasService } from '../services/faturas.service';
import { Cartao } from '../models/cartao.model';
import { CategoriaDespesa } from '../models/categoria-despesa.model';
import { DespesaCartao, ParcelaProjetada } from '../models/despesa-cartao.model';
import { ExtrairFaturaResposta, CartaoNaoEncontrado } from '../dtos/despesa-cartao-salvar.dto';
import { ProjecaoModalComponent } from '../projecao-modal/projecao-modal.component';
import { CategoriaSelectComponent } from '../categoria-select/categoria-select.component';
import { CartaoNaoCadastradoModalComponent } from '../cartao-nao-cadastrado-modal/cartao-nao-cadastrado-modal.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-fatura-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProjecaoModalComponent, CategoriaSelectComponent, CartaoNaoCadastradoModalComponent, SpinnerComponent],
  templateUrl: './fatura-upload.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class FaturaUploadComponent implements OnInit, OnDestroy {
  protected Math = Math;

  private cartoesService = inject(CartoesService);
  private faturasService = inject(FaturasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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

  cartoesNaoEncontrados = signal<CartaoNaoEncontrado[]>([]);
  mostrarModalCartao    = signal(false);

  private mapaFinalCartaoId = new Map<string, number>();
  private dadosPendentes: { despesas: DespesaCartao[] } | null = null;
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

  semCartaoAssociado = computed(() => this.despesas().some(d => d.cartaoId == null));

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

            this.mapaFinalCartaoId = new Map<string, number>();
            dados.despesas.forEach(d => {
              if (d.finalCartao && d.cartaoId != null) {
                this.mapaFinalCartaoId.set(d.finalCartao, d.cartaoId);
              }
            });

            const despesasMapeadas = dados.despesas.map(d => ({
              ...d,
              cartaoId: d.cartaoId ?? (d.finalCartao ? this.mapaFinalCartaoId.get(d.finalCartao) ?? null : null),
              idFatura: 0,
              idCategoriaDespesa: d.idCategoriaDespesa ?? undefined,
              valor: parseFloat((d.valor ?? 0).toFixed(2)),
              origem: 1,
              status: 1
            }));

            this.cabecalho.set(dados);
            this.statusExtracao.set('concluido');
            this.extraindo.set(false);

            if (dados.cartoesNaoEncontrados?.length > 0) {
              this.dadosPendentes = { despesas: despesasMapeadas };
              this.cartoesNaoEncontrados.set(dados.cartoesNaoEncontrados);
              this.mostrarModalCartao.set(true);
            } else {
              this.despesas.set(despesasMapeadas);
            }
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

  onCartoesCadastrados(mapa: Map<string, number>) {
    this.mostrarModalCartao.set(false);
    mapa.forEach((id, final) => this.mapaFinalCartaoId.set(final, id));
    const despesasResolvidas = (this.dadosPendentes?.despesas ?? []).map(d => ({
      ...d,
      cartaoId: d.cartaoId ?? (d.finalCartao ? this.mapaFinalCartaoId.get(d.finalCartao) ?? null : null),
    }));
    this.despesas.set(despesasResolvidas);
    this.dadosPendentes = null;
  }

  adicionarLinha() {
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
    const semCartao = this.despesas().some(d => d.cartaoId == null);
    if (semCartao) {
      this.erro.set('Existem lançamentos sem cartão associado. Remova-os ou cadastre o cartão.');
      return;
    }

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

  private async executarSalvamento(projecoes: ParcelaProjetada[]) {
    this.salvando.set(true);
    this.erro.set(null);

    const grupos = new Map<number, DespesaCartao[]>();
    for (const d of this.despesas()) {
      const cid = d.cartaoId ?? 0;
      if (!grupos.has(cid)) grupos.set(cid, []);
      grupos.get(cid)!.push(d);
    }

    try {
      await Promise.all(
        Array.from(grupos.entries()).map(([cartaoId, despesas]) =>
          firstValueFrom(this.faturasService.salvarDespesas(cartaoId, { despesas, projecoes }))
        )
      );
      this.salvando.set(false);
      this.router.navigate(['..'], { relativeTo: this.route });
    } catch (e: any) {
      this.erro.set(e?.error?.mensagem ?? 'Erro ao salvar despesas.');
      this.salvando.set(false);
    }
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
