import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ArtesPecaComponent } from '../../components/artes-peca.component';
import { ConfiguracaoFormularioBase } from '../../../administracao/configuracoes/pages/configuracoes-pagina/configuracao-formulario.base';
import { ORIGEM_VERSAO_PECA, Peca, PecaConteudo, STATUS_PECA } from '../../models/peca.model';
import { PecasService } from '../../services/pecas.service';

function paraCampoLocal(iso: string | null): string {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

@Component({
  selector: 'app-peca-editor',
  standalone: true,
  imports: [DatePipe, RouterLink, ReactiveFormsModule, BreadcrumbComponent, PageHeaderComponent, ArtesPecaComponent],
  templateUrl: './peca-editor.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class PecaEditorComponent extends ConfiguracaoFormularioBase {
  private readonly service = inject(PecasService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);
  private readonly rota = inject(ActivatedRoute);
  private consulta?: Subscription;
  protected override permissaoEdicao = 'marketing:editar';

  readonly id = Number(this.rota.snapshot.paramMap.get('id'));
  readonly peca = signal<Peca | null>(null);
  readonly carregando = signal(true);
  readonly processando = signal(false);
  readonly status = STATUS_PECA;
  readonly origem = ORIGEM_VERSAO_PECA;
  readonly acessoValido = computed(() => this.contextoValido() && this.auth.temPermissao('marketing:ler'));
  readonly podeAprovar = computed(() => this.acessoValido() && this.auth.temPermissao('marketing:aprovar'));
  readonly editavel = computed(() => this.acessoValido() && this.podeEditar() && this.peca()?.status !== 3);
  readonly tituloSugerido = computed(() => (this.peca()?.conteudo.legenda ?? '').split(/[.!?\n]/)[0].trim());
  readonly dataPrevista = new FormControl('', { nonNullable: true });

  readonly form = this.fb.nonNullable.group({
    legenda: ['', [Validators.required, Validators.maxLength(6000)]],
    cta: ['', Validators.maxLength(500)],
    hashtags: [''],
    ideiaVisual: ['', Validators.maxLength(2000)],
    roteiro: this.fb.array<FormControl<string>>([])
  });

  get roteiro(): FormArray<FormControl<string>> {
    return this.form.controls.roteiro;
  }

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.consulta?.unsubscribe());
    effect(() => {
      const editavel = this.editavel();
      untracked(() => {
        if (editavel) { this.form.enable({ emitEvent: false }); this.dataPrevista.enable({ emitEvent: false }); }
        else { this.form.disable({ emitEvent: false }); this.dataPrevista.disable({ emitEvent: false }); }
      });
    });
    this.carregar();
  }

  carregar(): void {
    if (!this.acessoValido() || !(this.id > 0)) return;
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.consulta = this.service.obter(this.id).pipe(
      takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))
    ).subscribe({
      next: res => { if (res.sucesso && res.dados) this.receber(res.dados, true); else this.toast.erro('Não foi possível carregar a peça.'); },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar a peça.')
    });
  }

  adicionarEtapa(): void {
    if (this.roteiro.length >= 20) return;
    this.roteiro.push(this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(1000)]));
    this.registrarAlteracao();
  }

  removerEtapa(indice: number): void {
    this.roteiro.removeAt(indice);
    this.registrarAlteracao();
  }

  salvar(): void {
    this.form.markAllAsTouched();
    const peca = this.peca();
    if (!peca || !this.editavel() || this.processando() || this.form.invalid) return;
    const conteudo = this.lerConteudo();
    if (conteudo.hashtags.length > 30 || conteudo.hashtags.some(h => h.length > 100)) {
      this.toast.aviso('Revise as hashtags.', 'Use até 30, cada uma com até 100 caracteres.');
      return;
    }
    this.executar(this.service.salvarConteudo(peca.id, conteudo, peca.versao), 'Nova versão salva.', 'Não foi possível salvar a nova versão.', true);
  }

  async aprovar(): Promise<void> {
    const peca = this.peca();
    if (!peca || !this.podeAprovar() || this.processando() || this.alterado() || peca.status !== 1) return;
    const confirmado = await this.confirm.confirmar(
      `Aprovar a versão ${peca.versaoAtual}?`,
      'Aprovar libera a exportação do texto. Qualquer edição depois disso cancela a aprovação. Nada é publicado.',
      { textoConfirmar: 'Aprovar', textoCancelar: 'Voltar' }
    );
    if (!confirmado) return;
    this.executar(this.service.aprovar(peca.id, peca.versao, peca.versaoAtual), 'Peça aprovada.', 'Não foi possível aprovar a peça.', true);
  }

  async arquivar(): Promise<void> {
    const peca = this.peca();
    if (!peca || !this.editavel() || this.processando()) return;
    const confirmado = await this.confirm.confirmar('Arquivar esta peça?', 'Uma peça arquivada não pode mais ser editada.', { textoConfirmar: 'Arquivar', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    this.executar(this.service.arquivar(peca.id, peca.versao), 'Peça arquivada.', 'Não foi possível arquivar a peça.', true);
  }

  salvarData(): void {
    const peca = this.peca();
    if (!peca || !this.editavel() || this.processando()) return;
    const valor = this.dataPrevista.value;
    const data = valor ? new Date(valor) : null;
    if (data && Number.isNaN(data.getTime())) { this.toast.aviso('Data inválida.'); return; }
    this.executar(this.service.planejar(peca.id, data ? data.toISOString() : null, peca.versao), valor ? 'Data prevista salva.' : 'Data prevista removida.', 'Não foi possível salvar a data.', false);
  }

  exportar(): void {
    const peca = this.peca();
    if (!peca || peca.status !== 2 || this.processando()) return;
    this.processando.set(true);
    this.service.exportar(peca.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: res => {
        if (!res.sucesso || !res.dados) { this.toast.erro('Não foi possível exportar a peça.'); return; }
        const arquivo = new Blob([res.dados.texto], { type: 'text/plain;charset=utf-8' });
        const endereco = URL.createObjectURL(arquivo);
        const ancora = document.createElement('a');
        ancora.href = endereco;
        ancora.download = res.dados.nomeArquivo;
        ancora.click();
        URL.revokeObjectURL(endereco);
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível exportar a peça.')
    });
  }

  private executar(chamada: ReturnType<PecasService['obter']>, sucesso: string, falha: string, recarregarFormulario: boolean): void {
    this.processando.set(true);
    chamada.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false))).subscribe({
      next: res => {
        if (res.sucesso && res.dados) { this.receber(res.dados, recarregarFormulario); this.toast.sucesso(sucesso); }
        else this.toast.erro(falha);
      },
      error: erro => this.toast.erroServidor(erro, falha)
    });
  }

  private lerConteudo(): PecaConteudo {
    const valores = this.form.getRawValue();
    return {
      legenda: valores.legenda.trim(),
      cta: valores.cta.trim(),
      hashtags: valores.hashtags.split(/\s+/).map(h => h.trim()).filter(Boolean),
      ideiaVisual: valores.ideiaVisual.trim(),
      roteiro: valores.roteiro.map(r => r.trim()).filter(Boolean)
    };
  }

  private receber(peca: Peca, recarregarFormulario: boolean): void {
    this.peca.set(peca);
    this.dataPrevista.setValue(paraCampoLocal(peca.planejadaPara), { emitEvent: false });
    if (recarregarFormulario) {
      this.roteiro.clear({ emitEvent: false });
      peca.conteudo.roteiro.forEach(etapa => this.roteiro.push(this.fb.nonNullable.control(etapa, [Validators.required, Validators.maxLength(1000)]), { emitEvent: false }));
      this.form.patchValue({ legenda: peca.conteudo.legenda, cta: peca.conteudo.cta, hashtags: peca.conteudo.hashtags.join(' '), ideiaVisual: peca.conteudo.ideiaVisual }, { emitEvent: false });
      this.marcarSalvo();
    }
    if (!this.editavel()) { this.form.disable({ emitEvent: false }); this.dataPrevista.disable({ emitEvent: false }); }
    else { this.form.enable({ emitEvent: false }); this.dataPrevista.enable({ emitEvent: false }); }
  }
}
