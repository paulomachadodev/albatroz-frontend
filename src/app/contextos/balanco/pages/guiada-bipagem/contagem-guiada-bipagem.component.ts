import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LeitorCodigoBarrasComponent } from '../../../../shared/components/leitor-codigo-barras/leitor-codigo-barras.component';
import { ScrollLockService } from '../../../../shared/services/scroll-lock.service';
import { ContagemSessaoService } from '../../services/contagem-sessao.service';
import { ContagemEstoqueService } from '../../services/contagem-estoque.service';
import { ProdutoPendenteSessao } from '../../models/contagem-estoque.model';
import { ToastService } from '../../../../core/feedback/toast.service';

const MENSAGENS_VITORIA = [
  'Você atingiu a meta de hoje, parabéns! Mas continue — pode ser que amanhã não sobre tempo, e a meta do mês agradece.',
  'Meta batida! Cada produto a mais hoje é um a menos pra correr atrás depois. Bora continuar?',
  'Parabéns, meta de hoje concluída! Se der, siga contando — isso garante a meta do mês sem aperto no fim.'
];

@Component({
  selector: 'app-contagem-guiada-bipagem',
  standalone: true,
  imports: [FormsModule, LeitorCodigoBarrasComponent],
  templateUrl: './contagem-guiada-bipagem.component.html',
  host: { class: 'block' }
})
export class ContagemGuiadaBipagemComponent implements OnInit, OnDestroy, AfterViewInit {
  private static readonly DURACAO_MENSAGEM_ERRO_MS = 15000;

  idSessao!: number;

  carregando = signal(true);
  passo = signal<'scaneando' | 'quantidade'>('scaneando');
  pendentes = signal<ProdutoPendenteSessao[]>([]);
  totalPendentes = signal(0);
  metaDiaAlvo = signal(0);
  contadosHoje = signal(0);
  modoLivre = signal(false);
  alvoLivre = signal<ProdutoPendenteSessao | null>(null);
  buscandoLivre = signal(false);

  quantidadeInput = '';
  bipando = signal(false);
  terminando = signal(false);
  mensagemErro = signal<string | null>(null);

  vitoriaAberta = signal(false);
  mensagemVitoria = signal('');
  private vitoriaJaExibida = false;

  @ViewChild('inputQuantidade') inputQuantidadeRef?: ElementRef<HTMLInputElement>;

  private audioContext?: AudioContext;
  private timeoutMensagemErro?: ReturnType<typeof setTimeout>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contagemSessaoService: ContagemSessaoService,
    private contagemEstoqueService: ContagemEstoqueService,
    private toast: ToastService,
    private scrollLock: ScrollLockService
  ) {
    this.scrollLock.travar();
  }

  ngOnInit() {
    this.idSessao = Number(this.route.snapshot.paramMap.get('idSessao'));
    this.carregando.set(true);
    this.contagemSessaoService.obterDetalhe(this.idSessao).subscribe({
      next: res => {
        this.modoLivre.set(res.dados?.sessao.modo === 'livre');
        this.carregarPendentes();
      },
      error: err => {
        this.carregando.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar a sessão de contagem.');
      }
    });
  }

  ngAfterViewInit() {
    this.audioContext = new AudioContext();
  }

  ngOnDestroy() {
    this.scrollLock.destravar();
    this.audioContext?.close();
    clearTimeout(this.timeoutMensagemErro);
  }

  get alvoAtual(): ProdutoPendenteSessao | null {
    return this.modoLivre() ? this.alvoLivre() : (this.pendentes()[0] ?? null);
  }

  private carregarPendentes() {
    this.carregando.set(true);
    this.contagemSessaoService.listarPendentes(this.idSessao).subscribe({
      next: res => {
        this.carregando.set(false);
        if (!res.dados) {
          this.toast.erro('Sessão de contagem não encontrada.');
          this.router.navigate(['/balanco/guiada']);
          return;
        }
        this.pendentes.set(res.dados.produtos);
        this.totalPendentes.set(res.dados.totalPendentes);
        this.metaDiaAlvo.set(res.dados.metaDiaAlvo);
        this.contadosHoje.set(res.dados.contadosHoje);
      },
      error: err => {
        this.carregando.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar a lista de produtos.');
      }
    });
  }

  aoLerCodigo(codigo: string) {
    if (this.modoLivre()) {
      this.buscarProdutoLivre(codigo.trim());
      return;
    }

    const alvo = this.alvoAtual;
    if (!alvo) {
      this.definirMensagemErro('Nenhum produto pendente pra contar.');
      return;
    }

    const codigoNormalizado = codigo.trim().toLowerCase();
    const bateComCodigo = alvo.codigo.trim().toLowerCase() === codigoNormalizado;
    const bateComGtin = !!alvo.gtin && alvo.gtin.trim().toLowerCase() === codigoNormalizado;

    if (!bateComCodigo && !bateComGtin) {
      this.definirMensagemErro(`Esse não é o produto esperado. Procure: ${alvo.codigo} — ${alvo.nome}`);
      return;
    }

    this.fecharMensagemErro();
    this.quantidadeInput = '';
    this.passo.set('quantidade');
    setTimeout(() => this.inputQuantidadeRef?.nativeElement.focus());
  }

  private buscarProdutoLivre(codigo: string) {
    if (this.buscandoLivre()) return;
    this.buscandoLivre.set(true);
    this.contagemEstoqueService.buscarProdutoPorCodigo(codigo).subscribe({
      next: res => {
        this.buscandoLivre.set(false);
        if (!res.dados) {
          this.definirMensagemErro('Produto não encontrado pra esse código.');
          return;
        }
        this.alvoLivre.set(res.dados);
        this.fecharMensagemErro();
        this.quantidadeInput = '';
        this.passo.set('quantidade');
        setTimeout(() => this.inputQuantidadeRef?.nativeElement.focus());
      },
      error: () => {
        this.buscandoLivre.set(false);
        this.definirMensagemErro('Produto não encontrado pra esse código.');
      }
    });
  }

  private definirMensagemErro(mensagem: string): void {
    this.mensagemErro.set(mensagem);
    clearTimeout(this.timeoutMensagemErro);
    this.timeoutMensagemErro = setTimeout(() => this.mensagemErro.set(null), ContagemGuiadaBipagemComponent.DURACAO_MENSAGEM_ERRO_MS);
  }

  fecharMensagemErro(): void {
    this.mensagemErro.set(null);
    clearTimeout(this.timeoutMensagemErro);
  }

  pular() {
    const fila = this.pendentes();
    if (fila.length <= 1) return;
    this.pendentes.set([...fila.slice(1), fila[0]]);
    this.mensagemErro.set(null);
  }

  cancelarQuantidade() {
    this.passo.set('scaneando');
    this.quantidadeInput = '';
  }

  confirmarQuantidade() {
    const alvo = this.alvoAtual;
    if (!alvo) return;

    const valor = Number(this.quantidadeInput.replace(',', '.'));
    if (this.quantidadeInput.trim() === '' || Number.isNaN(valor) || valor < 0) {
      this.toast.erro('Digite uma quantidade válida.');
      return;
    }

    this.bipando.set(true);
    this.contagemSessaoService.bipar(this.idSessao, { idProduto: alvo.idProduto, codigo: alvo.codigo, quantidadeContada: valor }).subscribe({
      next: () => {
        this.bipando.set(false);
        this.passo.set('scaneando');
        this.alvoLivre.set(null);
        this.recarregarAposBipe();
      },
      error: err => {
        this.bipando.set(false);
        this.toast.erroServidor(err, 'Não foi possível registrar essa contagem.');
      }
    });
  }

  private recarregarAposBipe() {
    this.contagemSessaoService.listarPendentes(this.idSessao).subscribe({
      next: res => {
        if (!res.dados) return;
        const contadosAntes = this.contadosHoje();

        this.pendentes.set(res.dados.produtos);
        this.totalPendentes.set(res.dados.totalPendentes);
        this.contadosHoje.set(res.dados.contadosHoje);
        this.metaDiaAlvo.set(res.dados.metaDiaAlvo);

        const meta = res.dados.metaDiaAlvo;
        if (!this.vitoriaJaExibida && meta > 0 && contadosAntes < meta && res.dados.contadosHoje >= meta) {
          this.vitoriaJaExibida = true;
          this.mensagemVitoria.set(MENSAGENS_VITORIA[Math.floor(Math.random() * MENSAGENS_VITORIA.length)]);
          this.vitoriaAberta.set(true);
          this.tocarJingleVitoria();
        }
      }
    });
  }

  fecharVitoria() {
    this.vitoriaAberta.set(false);
  }

  progressoPercentual(): number {
    if (this.metaDiaAlvo() <= 0) return 0;
    return Math.min(100, Math.round((this.contadosHoje() / this.metaDiaAlvo()) * 100));
  }

  fechar() {
    this.router.navigate(['/balanco/guiada'], { replaceUrl: true });
  }

  terminar() {
    this.terminando.set(true);
    this.contagemSessaoService.finalizar(this.idSessao).subscribe({
      next: () => {
        this.terminando.set(false);
        this.toast.sucesso('Contagem finalizada.', 'Pronta pra revisão e efetivação.');
        this.router.navigate(['/balanco/guiada'], { replaceUrl: true });
      },
      error: err => {
        this.terminando.set(false);
        this.toast.erroServidor(err, 'Não foi possível finalizar a contagem.');
      }
    });
  }

  private tocarJingleVitoria(): void {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') this.audioContext.resume();

    const notas = [523.25, 659.25, 783.99];
    notas.forEach((frequencia, indice) => {
      const inicio = this.audioContext!.currentTime + indice * 0.14;
      const oscilador = this.audioContext!.createOscillator();
      const ganho = this.audioContext!.createGain();
      oscilador.type = 'sine';
      oscilador.frequency.value = frequencia;
      ganho.gain.setValueAtTime(0.4, inicio);
      ganho.gain.exponentialRampToValueAtTime(0.001, inicio + 0.35);
      oscilador.connect(ganho);
      ganho.connect(this.audioContext!.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + 0.35);
    });
  }
}
