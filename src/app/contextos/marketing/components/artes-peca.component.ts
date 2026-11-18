import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/feedback/toast.service';
import { ConfirmService } from '../../../core/feedback/confirm.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { OpcaoSelectBusca, SelectBuscaComponent } from '../../../shared/components/select-busca/select-busca.component';
import { PERFIL_SELECT_PT } from '../../administracao/configuracoes/models/perfil-social.model';
import { Arte, FORMATOS_ARTE, MODELOS_ARTE, STATUS_ARTE } from '../models/arte.model';
import { ArtesService } from '../services/artes.service';

@Component({
  selector: 'app-artes-peca',
  standalone: true,
  imports: [ReactiveFormsModule, SelectModule, ModalComponent, SelectBuscaComponent],
  templateUrl: './artes-peca.component.html'
})
export class ArtesPecaComponent {
  private readonly service = inject(ArtesService);
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
  readonly produto = signal<OpcaoSelectBusca | null>(null);
  readonly formatos = FORMATOS_ARTE;
  readonly modelos = MODELOS_ARTE;
  readonly status = STATUS_ARTE;
  readonly selectPt = PERFIL_SELECT_PT;
  readonly buscarProdutos = this.service.buscarProdutosComFoto;

  readonly form = this.fb.nonNullable.group({
    formato: [1, Validators.required],
    modelo: [1, Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(70)]],
    subtitulo: ['', Validators.maxLength(120)]
  });

  readonly usaFoto = computed(() => this.modelos.find(m => m.valor === this.modeloAtual())?.usaFoto ?? false);
  private readonly modeloAtual = signal(1);
  readonly ativas = computed(() => this.itens().filter(a => a.status !== 3));
  readonly possuiAprovada = computed(() => this.itens().some(a => a.status === 2));

  constructor() {
    this.destroyRef.onDestroy(() => this.consulta?.unsubscribe());
    this.form.controls.modelo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(valor => { this.modeloAtual.set(valor); if (!this.usaFoto()) this.produto.set(null); });
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
      untracked(() => this.carregar());
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

  abrirCriacao(): void {
    if (!this.podeEditar()) return;
    this.form.reset({ formato: 1, modelo: 1, titulo: this.tituloSugerido().slice(0, 70), subtitulo: '' });
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
