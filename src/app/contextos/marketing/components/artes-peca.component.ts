import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { PT_MULTISELECT } from '../../../shared/utils/pt-multiselect';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/feedback/toast.service';
import { ConfirmService } from '../../../core/feedback/confirm.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { OpcaoSelectBusca, SelectBuscaComponent } from '../../../shared/components/select-busca/select-busca.component';
import { PERFIL_SELECT_PT } from '../../administracao/configuracoes/models/perfil-social.model';
import { Arte, FORMATOS_ARTE, MODELOS_ARTE, STATUS_ARTE } from '../models/arte.model';
import { ArtesService } from '../services/artes.service';
import { PublicacoesService } from '../services/publicacoes.service';
import { ConexaoMetaService } from '../../administracao/configuracoes/services/conexao-meta.service';
import { Publicacao, STATUS_PUBLICACAO } from '../models/publicacao.model';

@Component({
  selector: 'app-artes-peca',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, SelectModule, MultiSelectModule, ModalComponent, SelectBuscaComponent],
  templateUrl: './artes-peca.component.html',
  host: { '(input)': '$event.stopPropagation()', '(change)': '$event.stopPropagation()' }
})
export class ArtesPecaComponent {
  private readonly service = inject(ArtesService);
  private readonly publicacoesService = inject(PublicacoesService);
  private readonly conexaoService = inject(ConexaoMetaService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usuarioInicial = this.auth.usuario()?.id;
  private readonly empresaInicial = this.auth.empresaIdAtual();
  private consulta?: Subscription;

  readonly pecaId = input.required<number>();
  readonly versaoConteudo = input.required<number>();
  readonly tituloSugerido = input('');
  readonly arquivada = input(false);
  readonly possuiAprovadaAlterada = output<boolean>();

  readonly contextoValido = computed(() => this.auth.usuario()?.id === this.usuarioInicial && this.auth.empresaIdAtual() === this.empresaInicial && this.auth.temPermissao('marketing:ler'));
  readonly podeEditar = computed(() => this.contextoValido() && !this.arquivada() && this.auth.temPermissao('marketing:editar'));
  readonly podeAprovar = computed(() => this.contextoValido() && !this.arquivada() && this.auth.temPermissao('marketing:aprovar'));
  readonly carregando = signal(true);
  readonly processando = signal(false);
  readonly habilitado = signal(false);
  readonly itens = signal<Arte[]>([]);
  readonly modal = signal(false);
  readonly publicacoes = signal<Publicacao[]>([]);
  readonly publicacaoHabilitada = signal(false);
  readonly destinos = signal<{ id: number; rotulo: string }[]>([]);
  readonly destinoIds = signal<number[]>([]);
  readonly multiselectPt = PT_MULTISELECT;
  readonly statusPublicacao = STATUS_PUBLICACAO;
  readonly rascunhos = computed(() => this.itens().filter(a => a.status === 1 && a.arquivoDisponivel).length);
  readonly aprovadas = computed(() => this.itens().filter(a => a.status === 2 && a.arquivoDisponivel).slice(0, 10));
  readonly produto = signal<OpcaoSelectBusca | null>(null);
  readonly formatos = FORMATOS_ARTE;
  readonly modelos = MODELOS_ARTE;
  readonly status = STATUS_ARTE;
  readonly selectPt = PERFIL_SELECT_PT;
  readonly buscarProdutos = this.service.buscarProdutosComFoto;

  readonly form = this.fb.nonNullable.group({
    formato: [2, Validators.required],
    modelo: [1, Validators.required],
    titulo: ['', Validators.maxLength(70)],
    subtitulo: ['', Validators.maxLength(120)]
  });

  readonly usaFoto = computed(() => this.modelos.find(m => m.valor === this.modeloAtual())?.usaFoto ?? false);
  private readonly modeloAtual = signal(1);
  readonly ativas = computed(() => this.itens().filter(a => a.status !== 3));
  readonly possuiAprovada = computed(() => this.itens().some(a => a.status === 2));

  constructor() {
    this.destroyRef.onDestroy(() => this.consulta?.unsubscribe());
    this.form.controls.modelo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(valor => {
      this.modeloAtual.set(valor);
      if (!this.usaFoto()) {
        this.produto.set(null);
        if (!this.form.controls.titulo.value.trim()) this.form.controls.titulo.setValue(this.tituloSugerido().slice(0, 70));
      }
    });
    effect(() => {
      if (this.contextoValido()) return;
      this.consulta?.unsubscribe();
      this.itens.set([]);
      this.modal.set(false);
      this.carregando.set(false);
    });
    effect(() => { this.possuiAprovadaAlterada.emit(this.possuiAprovada()); });
    effect(() => {
      this.pecaId();
      untracked(() => { this.carregar(); this.carregarPublicacoes(); });
    });
  }

  carregar(): void {
    if (!this.contextoValido()) return;
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.consulta = this.service.listar(this.pecaId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (!this.contextoValido()) return;
        this.carregando.set(false);
        if (res.sucesso && res.dados) { this.habilitado.set(res.dados.habilitado); this.itens.set(res.dados.itens); }
        else this.toast.erro('Não foi possível carregar as artes.');
      },
      error: erro => { this.carregando.set(false); this.toast.erroServidor(erro, 'Não foi possível carregar as artes.'); }
    });
  }

  carregarPublicacoes(): void {
    if (!this.contextoValido()) return;
    this.publicacoesService.listar(this.pecaId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (!this.contextoValido() || !res.sucesso || !res.dados) return;
        this.publicacaoHabilitada.set(res.dados.habilitado);
        this.publicacoes.set(res.dados.itens);
        if (res.dados.habilitado && this.podeAprovar() && this.destinos().length === 0) this.carregarDestinos();
      },
      error: () => this.publicacaoHabilitada.set(false)
    });
  }

  private carregarDestinos(): void {
    this.conexaoService.obterConexao().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const conexao = res.sucesso ? res.dados?.conexao : null;
        if (!conexao) return;
        const lista = conexao.ativos
          .filter(a => a.selecionado && (a.tipo === 1 ? conexao.podePublicarFacebook : conexao.podePublicarInstagram))
          .map(a => ({ id: a.id, rotulo: (a.tipo === 1 ? 'Facebook: ' : 'Instagram: ') + a.nome + (a.usuario ? ' (@' + a.usuario + ')' : '') }));
        this.destinos.set(lista);
        this.destinoIds.set(lista.length === 1 ? [lista[0].id] : []);
      },
      error: () => this.destinos.set([])
    });
  }

  async publicar(): Promise<void> {
    const escolhidos = this.destinos().filter(d => this.destinoIds().includes(d.id));
    if (!this.podeAprovar() || this.processando() || escolhidos.length === 0 || this.aprovadas().length === 0) return;
    const nomes = escolhidos.map(d => d.rotulo).join(' e ');
    const confirmado = await this.confirm.confirmar('Publicar agora?', 'Será publicado em ' + nomes + ' com ' + this.aprovadas().length + ' arte(s) e o texto aprovado. Isso não pode ser desfeito por aqui.', { textoConfirmar: 'Publicar', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    this.processando.set(true);
    const artes = this.aprovadas().map(a => a.id);
    let falhas = 0;
    for (const destino of escolhidos) {
      try {
        const res = await firstValueFrom(this.publicacoesService.publicar(this.pecaId(), { ativoId: destino.id, arteIds: artes }));
        if (res.sucesso) this.toast.sucesso('Publicado em ' + destino.rotulo + '.'); else { falhas++; this.toast.erro('Não foi possível publicar em ' + destino.rotulo + '.'); }
      } catch (erro) {
        falhas++;
        this.toast.erroServidor(erro, 'Não foi possível publicar em ' + destino.rotulo + '.');
      }
    }
    this.processando.set(false);
    this.carregarPublicacoes();
  }

  abrirCriacao(): void {
    if (!this.podeEditar()) return;
    this.form.reset({ formato: 2, modelo: 1, titulo: '', subtitulo: '' });
    this.modeloAtual.set(1);
    this.produto.set(null);
    this.modal.set(true);
  }

  fechar(): void {
    if (!this.processando()) this.modal.set(false);
  }

  gerar(): void {
    this.form.markAllAsTouched();
    if (!this.podeEditar() || this.processando() || this.form.invalid) return;
    if (this.usaFoto() && !this.produto()) { this.toast.aviso('Escolha o produto.', 'Este modelo usa a foto de um produto.'); return; }
    if (!this.usaFoto() && !this.form.controls.titulo.value.trim()) { this.toast.aviso('Informe o título.', 'O modelo Texto em destaque precisa de um título.'); return; }
    const valores = this.form.getRawValue();
    this.processando.set(true);
    this.service.gerar(this.pecaId(), {
      formato: valores.formato, modelo: valores.modelo, produtoId: this.usaFoto() ? this.produto()!.id : null,
      titulo: valores.titulo.trim(), subtitulo: valores.subtitulo.trim()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.processando.set(false);
        if (res.sucesso) { this.modal.set(false); this.toast.sucesso('Arte criada em rascunho.'); this.carregar(); }
        else this.toast.erro('Não foi possível criar a arte.');
      },
      error: erro => { this.processando.set(false); this.toast.erroServidor(erro, 'Não foi possível criar a arte.'); }
    });
  }

  async aprovar(arte: Arte): Promise<void> {
    if (!this.podeAprovar() || this.processando() || arte.status !== 1 || !arte.arquivoDisponivel) return;
    const confirmado = await this.confirm.confirmar('Aprovar esta arte?', 'A arte aprovada fica guardada para a publicação. Nada é publicado agora.', { textoConfirmar: 'Aprovar', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    this.executar(this.service.aprovar(this.pecaId(), arte.id, arte.versao), 'Arte aprovada.', 'Não foi possível aprovar a arte.');
  }

  async descartar(arte: Arte): Promise<void> {
    if (!this.podeEditar() || this.processando() || arte.status === 3) return;
    const confirmado = await this.confirm.confirmar('Descartar esta arte?', 'O arquivo é apagado. Você pode criar a arte de novo quando quiser.', { textoConfirmar: 'Descartar', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    this.executar(this.service.descartar(this.pecaId(), arte.id, arte.versao), 'Arte descartada.', 'Não foi possível descartar a arte.');
  }

  desatualizada(arte: Arte): boolean {
    return arte.versaoConteudo !== this.versaoConteudo();
  }

  private executar(chamada: ReturnType<ArtesService['aprovar']>, sucesso: string, falha: string): void {
    this.processando.set(true);
    chamada.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.processando.set(false);
        if (res.sucesso) { this.toast.sucesso(sucesso); this.carregar(); }
        else this.toast.erro(falha);
      },
      error: erro => { this.processando.set(false); this.toast.erroServidor(erro, falha); }
    });
  }
}
