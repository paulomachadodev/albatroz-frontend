import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize, takeUntil } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { IdentidadeMarca } from '../../models/identidade-marca.model';
import { IdentidadeMarcaService } from '../../services/identidade-marca.service';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';

function validarFusoMarca(controle: AbstractControl): { fuso: true } | null {
  try { new Intl.DateTimeFormat('pt-BR', { timeZone: String(controle.value).trim() }); return null; } catch { return { fuso: true }; }
}

function validarIdiomaMarca(controle: AbstractControl): { idioma: true } | null {
  try { return Intl.getCanonicalLocales(String(controle.value).trim()).length === 1 ? null : { idioma: true }; } catch { return { idioma: true }; }
}

@Component({
  selector: 'app-identidade-marca', standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, InputTextModule, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './identidade-marca.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class IdentidadeMarcaComponent extends ConfiguracaoFormularioBase {
  private readonly service = inject(IdentidadeMarcaService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly navegacao = inject(Router);
  private readonly fb = inject(FormBuilder);
  private consulta?: Subscription;
  private gravacao?: Subscription;
  private operacaoId = 0;
  protected override permissaoEdicao = 'identidade_marca:editar';
  readonly acessoValido = computed(() => this.contextoValido() && this.auth.temPermissao('identidade_marca:ler'));
  readonly dados = signal<IdentidadeMarca | null>(null);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly precisaAtualizar = signal(false);
  readonly disponivel = computed(() => this.acessoValido() && this.dados()?.habilitado === true);
  readonly podeAbrirCadastro = computed(() => this.acessoValido() && this.auth.temPermissao('configuracoes:ler'));
  readonly cores = [{ campo: 'principal', rotulo: 'Principal' }, { campo: 'secundaria', rotulo: 'Secundária' }, { campo: 'fundo', rotulo: 'Fundo' }, { campo: 'texto', rotulo: 'Texto' }] as const;
  readonly form = this.fb.nonNullable.group({
    nomeDivulgacao: ['', [Validators.required, Validators.maxLength(160)]],
    segmentos: [''], propostaValor: ['', Validators.maxLength(4000)], ofertas: ['', Validators.maxLength(4000)],
    publicos: [''], regioes: [''], idioma: ['', [Validators.required, Validators.maxLength(35), validarIdiomaMarca]],
    fusoHorario: ['', [Validators.required, Validators.maxLength(100), validarFusoMarca]],
    tomVoz: ['', Validators.maxLength(1000)], restricoes: ['', Validators.maxLength(4000)], fontes: ['', Validators.maxLength(500)],
    cores: this.fb.nonNullable.group({ principal: ['', Validators.pattern(/^#[0-9a-fA-F]{6}$/)], secundaria: ['', Validators.pattern(/^#[0-9a-fA-F]{6}$/)], fundo: ['', Validators.pattern(/^#[0-9a-fA-F]{6}$/)], texto: ['', Validators.pattern(/^#[0-9a-fA-F]{6}$/)] })
  });

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.cancelarGravacao());
    effect(() => {
      const acesso = this.acessoValido();
      const editar = this.podeEditar();
      const disponivel = this.disponivel();
      untracked(() => {
        if (!acesso) {
          this.consulta?.unsubscribe();
          this.cancelarGravacao();
          this.dados.set(null);
          this.form.reset();
          this.alterado.set(false);
          this.carregando.set(false);
          if (this.contextoValido()) queueMicrotask(() => {
            if (!this.destroyRef.destroyed && !this.acessoValido()) void this.navegacao.navigate(['/configuracoes'], { replaceUrl: true });
          });
        }
        if (!editar || !acesso) {
          this.cancelarGravacao();
          if (this.dados()) this.preencher(this.dados()!);
          this.form.disable({ emitEvent: false });
          this.alterado.set(false);
        } else if (disponivel) this.form.enable({ emitEvent: false });
      });
    });
    this.carregar();
  }

  async carregar(): Promise<void> {
    if (!this.acessoValido() || this.salvando()) return;
    if (this.alterado() && !await this.podeSair()) return;
    if (!this.acessoValido() || this.destroyRef.destroyed) return;
    this.cancelarGravacao();
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.consulta = this.service.obter().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: resposta => {
        if (!this.acessoValido()) return;
        if (resposta.sucesso && resposta.dados) this.receber(resposta.dados);
        else this.toast.erro('Não foi possível carregar a identidade da marca.');
      },
      error: erro => { if (this.acessoValido()) this.toast.erroServidor(erro, 'Não foi possível carregar a identidade da marca.'); }
    });
  }

  salvar(): void {
    this.form.markAllAsTouched();
    if (!this.disponivel() || !this.podeEditar() || this.salvando() || this.precisaAtualizar() || this.form.invalid) return;
    const valores = this.form.getRawValue();
    const segmentos = this.itens(valores.segmentos);
    const publicos = this.itens(valores.publicos);
    const regioes = this.itens(valores.regioes);
    if (!valores.nomeDivulgacao.trim() || [segmentos, publicos, regioes].some(itens => itens.length > 20 || itens.some(item => item.length > 120) || new Set(itens.map(item => item.toLocaleLowerCase('pt-BR'))).size !== itens.length)) {
      this.toast.aviso('Revise o nome e as listas de segmentos, públicos e regiões.', 'Cada lista aceita até 20 itens de até 120 caracteres, sem repetição.'); return;
    }
    const id = ++this.operacaoId;
    const versaoEsperada = this.dados()!.versao;
    this.salvando.set(true);
    this.gravacao = this.service.salvar({ ...valores, nomeDivulgacao: valores.nomeDivulgacao.trim(), idioma: valores.idioma.trim(), fusoHorario: valores.fusoHorario.trim(), segmentos, publicos, regioes, versaoEsperada }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        if (!this.gravacaoValida(id)) return;
        this.salvando.set(false);
        if (resposta.sucesso && resposta.dados) { this.receber(resposta.dados); this.toast.sucesso('Identidade da marca salva.'); }
        else { this.precisaAtualizar.set(true); this.toast.erro('Não foi possível confirmar a gravação. Atualize a consulta antes de repetir.'); }
      },
      error: erro => {
        if (!this.gravacaoValida(id)) return;
        this.salvando.set(false);
        this.precisaAtualizar.set(true);
        this.toast.erroServidor(erro, 'Não foi possível confirmar a gravação. Atualize a consulta antes de repetir.');
      }
    });
  }

  corPreview(cor: string): string {
    return /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : 'transparent';
  }

  logoSeguro(valor: string | null): string | null {
    if (!valor) return null;
    try { const url = new URL(valor); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
  }

  private itens(texto: string): string[] {
    return texto.split(/[;\n]/).map(item => item.trim()).filter(Boolean);
  }

  private preencher(dados: IdentidadeMarca): void {
    this.form.reset({ ...dados, segmentos: dados.segmentos.join('\n'), publicos: dados.publicos.join('\n'), regioes: dados.regioes.join('\n'), idioma: dados.idioma || 'pt-BR', fusoHorario: dados.fusoHorario || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') });
  }

  private receber(dados: IdentidadeMarca): void {
    this.dados.set(dados);
    this.preencher(dados);
    this.precisaAtualizar.set(false);
    if (!dados.habilitado || !this.podeEditar()) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
    this.marcarSalvo();
  }

  private gravacaoValida(id: number): boolean {
    return id === this.operacaoId && !this.destroyRef.destroyed && this.disponivel() && this.podeEditar();
  }

  private cancelarGravacao(): void {
    this.operacaoId++;
    this.gravacao?.unsubscribe();
    this.salvando.set(false);
  }
}
