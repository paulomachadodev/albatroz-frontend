import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { BtnIconeComponent } from '../../../../../shared/components/btn-icone/btn-icone.component';
import { ToggleComponent } from '../../../../../shared/components/toggle/toggle.component';
import {
  AbaAgente, ArquivosConteudo, DiaEdicao, EncerramentoConteudo, GRUPO_IDENTIDADE, GRUPO_VENDAS, InstrucoesConteudo, LojaConteudo,
  NOMES_DIAS, NomeSecao, ProtecoesConteudo, SECAO, SecoesAgente, TIPOS_LINK_ENCERRAMENTO,
  diasParaEdicao, diasParaGravar, secaoDaAba, separarLista, separarMeses
} from '../../models/agente-secoes.model';
import { AgenteAtendimentoService } from '../../services/agente-atendimento.service';

@Component({
  selector: 'app-agente-secoes', standalone: true,
  imports: [FormsModule, InputTextModule, SelectModule, BtnIconeComponent, ToggleComponent],
  templateUrl: './agente-secoes.component.html', host: { class: 'block' }
})
export class AgenteSecoesComponent implements OnInit {
  private readonly service = inject(AgenteAtendimentoService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly aba = input.required<AbaAgente>();
  readonly podeEditar = input(false);
  readonly pendente = output<boolean>();

  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly falhou = signal(false);
  readonly secoes = signal<SecoesAgente | null>(null);

  readonly nomesDias = NOMES_DIAS;
  readonly tiposLink = TIPOS_LINK_ENCERRAMENTO;

  instrucoes: InstrucoesConteudo | null = null;
  loja: LojaConteudo | null = null;
  arquivos: ArquivosConteudo | null = null;
  encerramento: EncerramentoConteudo | null = null;
  protecoes: ProtecoesConteudo | null = null;
  dias: DiaEdicao[] = [];
  palavrasMapa = '';
  respostasCotar = '';
  respostasImprimir = '';
  meses = '';

  private readonly alteradas = new Set<NomeSecao>();

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.falhou.set(false);
    this.service.obterSecoes().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: resposta => {
        if (!resposta.sucesso || !resposta.dados) { this.falhou.set(true); return; }
        this.secoes.set(resposta.dados);
        (Object.keys(SECAO) as NomeSecao[]).forEach(nome => this.preencher(nome, resposta.dados!));
      },
      error: erro => { this.falhou.set(true); this.toast.erroServidor(erro, 'Não foi possível carregar as configurações do agente.'); }
    });
  }

  private preencher(nome: NomeSecao, dados: SecoesAgente): void {
    const copia = dados[nome] ? structuredClone(dados[nome]!.conteudo) : null;
    if (nome === 'instrucoes') this.instrucoes = copia as InstrucoesConteudo | null;
    if (nome === 'protecoes') this.protecoes = copia as ProtecoesConteudo | null;
    if (nome === 'encerramento') this.encerramento = copia as EncerramentoConteudo | null;
    if (nome === 'loja') {
      this.loja = copia as LojaConteudo | null;
      this.dias = diasParaEdicao(this.loja?.dias ?? []);
      this.palavrasMapa = this.loja?.palavrasMapa.join(', ') ?? '';
    }
    if (nome === 'arquivos') {
      this.arquivos = copia as ArquivosConteudo | null;
      this.respostasCotar = this.arquivos?.respostasCotar.join(', ') ?? '';
      this.respostasImprimir = this.arquivos?.respostasImprimir.join(', ') ?? '';
      this.meses = this.arquivos?.mesesAltaTemporada.join(', ') ?? '';
    }
  }

  blocos() {
    const grupo = this.aba() === 'identidade' ? GRUPO_IDENTIDADE : GRUPO_VENDAS;
    return this.instrucoes?.blocos.filter(bloco => bloco.editavel && bloco.grupo === grupo) ?? [];
  }

  semConfiguracao(): boolean {
    const nome = secaoDaAba(this.aba());
    return !!nome && !this.secoes()?.[nome];
  }

  marcarAlterada(): void {
    const nome = secaoDaAba(this.aba());
    if (!nome || !this.podeEditar()) return;
    this.alteradas.add(nome);
    this.pendente.emit(true);
  }

  adicionarLink(): void {
    this.encerramento?.links.push({ tipo: 1, texto: '', url: 'https://' });
    this.marcarAlterada();
  }

  removerLink(indice: number): void {
    this.encerramento?.links.splice(indice, 1);
    this.marcarAlterada();
  }

  conteudoParaGravar(nome: NomeSecao): object | null {
    if (nome === 'loja') return this.loja ? { ...this.loja, dias: diasParaGravar(this.dias), palavrasMapa: separarLista(this.palavrasMapa) } : null;
    if (nome === 'arquivos') {
      return this.arquivos ? {
        ...this.arquivos, respostasCotar: separarLista(this.respostasCotar),
        respostasImprimir: separarLista(this.respostasImprimir), mesesAltaTemporada: separarMeses(this.meses)
      } : null;
    }
    if (nome === 'instrucoes') return this.instrucoes;
    if (nome === 'encerramento') return this.encerramento;
    return this.protecoes;
  }

  salvar(): void {
    const nome = secaoDaAba(this.aba());
    const atual = nome ? this.secoes()?.[nome] : null;
    const conteudo = nome ? this.conteudoParaGravar(nome) : null;
    if (!nome || !atual || !conteudo || !this.podeEditar() || this.salvando()) return;
    this.salvando.set(true);
    this.service.salvarSecao(SECAO[nome], { conteudo, versaoEsperada: atual.versao })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando.set(false))).subscribe({
        next: resposta => {
          if (!resposta.sucesso || !resposta.dados) { this.toast.erro('Não foi possível salvar.'); return; }
          this.secoes.set(resposta.dados);
          this.preencher(nome, resposta.dados);
          this.alteradas.delete(nome);
          this.pendente.emit(this.alteradas.size > 0);
          this.toast.sucesso('Configuração salva. A Albia passa a usar nas próximas conversas.');
        },
        error: erro => this.toast.erroServidor(erro, 'Não foi possível salvar.')
      });
  }
}
