import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { PT_MULTISELECT } from '../../../../shared/utils/pt-multiselect';
import { AjudaCampoComponent } from '../../../../shared/components/ajuda-campo/ajuda-campo.component';
import { MarketingGuiaComponent } from '../../components/marketing-guia.component';
import { PerfisSociaisService } from '../../../administracao/configuracoes/services/perfis-sociais.service';
import { FORMATOS_EDITORIAIS } from '../../../administracao/configuracoes/models/perfil-social.model';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ConfiguracaoFormularioBase } from '../../../administracao/configuracoes/pages/configuracoes-pagina/configuracao-formulario.base';
import { EstrategiaEditorial, LinhaEditorial, OBJETIVOS_MARKETING, SUGESTOES_LINHAS } from '../../models/marketing.model';
import { MarketingService } from '../../services/marketing.service';

function criarLinha(fb: FormBuilder, linha?: Partial<LinhaEditorial>) {
  return fb.nonNullable.group({
    nome: [linha?.nome ?? '', [Validators.required, Validators.maxLength(120)]],
    objetivo: [linha?.objetivo ?? '', Validators.maxLength(500)],
    exemplos: [linha?.exemplos ?? '', Validators.maxLength(1000)],
    restricoes: [linha?.restricoes ?? '', Validators.maxLength(1000)],
    formatos: [(linha?.formatos ?? []).join('\n')],
    participacao: [linha?.participacao ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
    ativa: [linha?.ativa ?? true]
  });
}

@Component({
  selector: 'app-estrategia-editorial',
  standalone: true,
  imports: [MultiSelectModule, AjudaCampoComponent, MarketingGuiaComponent, RouterLink, DatePipe, ReactiveFormsModule, BreadcrumbComponent, PageHeaderComponent],
  templateUrl: './estrategia-editorial.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EstrategiaEditorialComponent extends ConfiguracaoFormularioBase {
  readonly multiselectPt = PT_MULTISELECT;
  private readonly service = inject(MarketingService);
  private readonly perfisService = inject(PerfisSociaisService);
  readonly redesCadastradas = signal<string[]>([]);
  readonly perfisHabilitados = signal(false);
  readonly formatosSugeridos = FORMATOS_EDITORIAIS;
  readonly podeGerenciarPerfis = computed(() => this.auth.temPermissao('integracoes_sociais:ler'));
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private consulta?: Subscription;
  private gravacao?: Subscription;
  protected override permissaoEdicao = 'marketing:editar';

  readonly objetivos = OBJETIVOS_MARKETING;
  readonly dados = signal<EstrategiaEditorial | null>(null);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly precisaAtualizar = signal(false);
  readonly acessoValido = computed(() => this.contextoValido() && this.auth.temPermissao('marketing:ler'));
  readonly disponivel = computed(() => this.acessoValido() && this.dados()?.habilitado === true);

  readonly form = this.fb.nonNullable.group({
    objetivo: [1, Validators.required],
    pecasPorSemana: [3, [Validators.required, Validators.min(1), Validators.max(100)]],
    limiteTexto: [0, [Validators.required, Validators.min(0), Validators.max(5000)]],
    redes: [[] as string[]],
    formatos: [[] as string[]],
    assuntosProibidos: [''],
    linhas: this.fb.array<ReturnType<typeof criarLinha>>([])
  });

  get linhas(): FormArray {
    return this.form.controls.linhas;
  }

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.gravacao?.unsubscribe());
    effect(() => {
      const editar = this.podeEditar();
      const disponivel = this.disponivel();
      untracked(() => {
        if (!editar || !disponivel) this.form.disable({ emitEvent: false });
        else this.form.enable({ emitEvent: false });
      });
    });
    this.perfisService.filtros().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({ next: res => { if (!this.acessoValido()) return; this.perfisHabilitados.set(res.dados?.redesSociaisHabilitado === true); this.redesCadastradas.set(res.dados?.redes ?? []); }, error: () => undefined });
    this.carregar();
  }

  redesOpcoes(): { rotulo: string; valor: string; desabilitada: boolean }[] {
    const ativas = this.perfisHabilitados() ? this.redesCadastradas() : (this.dados()?.redes ?? []);
    const legadas = this.form.controls.redes.value.filter(rede => !ativas.includes(rede));
    return [...ativas.map(valor => ({ rotulo: valor, valor, desabilitada: false })), ...legadas.map(valor => ({ rotulo: valor + ' (fora dos perfis ativos)', valor, desabilitada: true }))];
  }

  formatosOpcoes(): { rotulo: string; valor: string; desabilitada: boolean }[] {
    return [...this.formatosSugeridos.map(valor => ({ rotulo: valor, valor, desabilitada: false })), ...this.form.controls.formatos.value.filter(valor => !this.formatosSugeridos.includes(valor)).map(valor => ({ rotulo: valor + ' (legado)', valor, desabilitada: true }))];
  }

  carregar(): void {
    if (!this.acessoValido() || this.salvando()) return;
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.consulta = this.service.obterEstrategia().pipe(
      takeUntil(this.contextoEncerrado),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.carregando.set(false))
    ).subscribe({
      next: resposta => {
        if (resposta.sucesso && resposta.dados) this.receber(resposta.dados);
        else this.toast.erro('Não foi possível carregar a estratégia editorial.');
      },
      error: erro => this.toast.erroServidor(erro, 'Não foi possível carregar a estratégia editorial.')
    });
  }

  adicionarLinha(): void {
    this.linhas.push(criarLinha(this.fb, { participacao: 0 }));
    this.alterado.set(true);
  }

  removerLinha(indice: number): void {
    this.linhas.removeAt(indice);
    this.alterado.set(true);
  }

  aplicarSugestoes(): void {
    this.linhas.clear();
    SUGESTOES_LINHAS.forEach(linha => this.linhas.push(criarLinha(this.fb, linha)));
    this.alterado.set(true);
  }

  totalAtivas(): number {
    return this.linhas.getRawValue().filter(l => l.ativa).reduce((soma, l) => soma + (Number(l.participacao) || 0), 0);
  }

  temLinhasAtivas(): boolean {
    return this.linhas.getRawValue().some(l => l.ativa);
  }

  participacaoValida(): boolean {
    return !this.temLinhasAtivas() || this.totalAtivas() === 100;
  }

  salvar(): void {
    this.form.markAllAsTouched();
    if (!this.disponivel() || !this.podeEditar() || this.salvando() || this.precisaAtualizar() || this.form.invalid) return;
    if (!this.participacaoValida()) {
      this.toast.aviso('A participação das linhas ativas deve totalizar 100%.', `Total atual: ${this.totalAtivas()}%.`);
      return;
    }
    const valores = this.form.getRawValue();
    const redes = this.itens(valores.redes);
    const formatos = this.itens(valores.formatos);
    const assuntosProibidos = this.itens(valores.assuntosProibidos);
    const linhas: LinhaEditorial[] = valores.linhas.map(l => ({
      nome: String(l.nome).trim(),
      objetivo: String(l.objetivo).trim(),
      exemplos: String(l.exemplos).trim(),
      restricoes: String(l.restricoes).trim(),
      formatos: this.itens(String(l.formatos)),
      participacao: Number(l.participacao),
      ativa: !!l.ativa
    }));
    if (!this.listasValidas([redes, formatos, assuntosProibidos, ...linhas.map(l => l.formatos)]) || this.nomesRepetidos(linhas)) {
      this.toast.aviso('Revise as listas e os nomes das linhas.', 'Não repita itens e use no máximo 120 caracteres por item.');
      return;
    }
    const versaoEsperada = this.dados()!.versao;
    this.salvando.set(true);
    this.gravacao?.unsubscribe();
    this.gravacao = this.service.salvarEstrategia({
      objetivo: Number(valores.objetivo), pecasPorSemana: Number(valores.pecasPorSemana), limiteTexto: Number(valores.limiteTexto),
      redes, formatos, assuntosProibidos, linhas, versaoEsperada
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        this.salvando.set(false);
        if (resposta.sucesso && resposta.dados) {
          this.receber(resposta.dados);
          this.toast.sucesso('Estratégia editorial salva.');
        } else {
          this.precisaAtualizar.set(true);
          this.toast.erro('Não foi possível confirmar a gravação. Atualize a consulta antes de repetir.');
        }
      },
      error: erro => {
        this.salvando.set(false);
        this.precisaAtualizar.set(true);
        this.toast.erroServidor(erro, 'Não foi possível salvar a estratégia editorial.');
      }
    });
  }

  private itens(texto: string | string[]): string[] {
    if (Array.isArray(texto)) return texto.map(item => item.trim()).filter(Boolean);
    return texto.split(/[;\n]/).map(item => item.trim()).filter(Boolean);
  }

  private listasValidas(listas: string[][]): boolean {
    return listas.every(lista => lista.every(item => item.length <= 120) && new Set(lista.map(i => i.toLocaleLowerCase('pt-BR'))).size === lista.length);
  }

  private nomesRepetidos(linhas: LinhaEditorial[]): boolean {
    return new Set(linhas.map(l => l.nome.toLocaleLowerCase('pt-BR'))).size !== linhas.length;
  }

  private receber(dados: EstrategiaEditorial): void {
    this.dados.set(dados);
    this.linhas.clear();
    dados.linhas.forEach(linha => this.linhas.push(criarLinha(this.fb, linha)));
    this.form.patchValue({
      objetivo: dados.objetivo || 1,
      pecasPorSemana: dados.pecasPorSemana || 3,
      limiteTexto: dados.limiteTexto ?? 0,
      redes: dados.redes,
      formatos: dados.formatos,
      assuntosProibidos: dados.assuntosProibidos.join('\n')
    });
    this.precisaAtualizar.set(false);
    if (!dados.habilitado || !this.podeEditar()) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
    this.marcarSalvo();
  }
}
