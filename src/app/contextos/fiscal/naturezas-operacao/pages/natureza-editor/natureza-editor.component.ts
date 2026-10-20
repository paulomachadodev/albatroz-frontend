import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NaturezasOperacaoService } from '../../services/naturezas-operacao.service';
import {
  NaturezaOperacaoDados,
  NaturezaOperacaoExcecao,
  TributacaoResolvida,
  TributoResolvido
} from '../../models/natureza-operacao.model';
import { naturezaOperacaoVazia } from '../../models/natureza-operacao.padrao';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';

type Aba = 'geral' | 'icms' | 'impostos' | 'excecoes' | 'operacional' | 'simulador';

interface ExcecaoEdicao {
  tributo: string;
  ufsTexto: string;
  ncmsTexto: string;
  cfop: string;
  situacaoTributaria: string;
  aliquota: number | null;
  baseReducao: number | null;
  prioridade: number;
  ativo: number;
}

@Component({
  selector: 'app-natureza-editor',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './natureza-editor.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class NaturezaEditorComponent implements OnInit {
  readonly ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE',
    'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'EX'
  ];

  readonly abas: { id: Aba; rotulo: string }[] = [
    { id: 'geral', rotulo: 'Geral' },
    { id: 'icms', rotulo: 'ICMS e CFOP' },
    { id: 'impostos', rotulo: 'IPI, PIS e COFINS' },
    { id: 'excecoes', rotulo: 'Exceções' },
    { id: 'operacional', rotulo: 'Operação' },
    { id: 'simulador', rotulo: 'Simulador' }
  ];

  readonly tributos = [
    { id: 'icms', rotulo: 'ICMS / Simples' },
    { id: 'ipi', rotulo: 'IPI' },
    { id: 'pis', rotulo: 'PIS' },
    { id: 'cofins', rotulo: 'COFINS' },
    { id: 'issqn', rotulo: 'ISSQN' }
  ];

  id: number | null = null;
  n: NaturezaOperacaoDados = naturezaOperacaoVazia();
  excecoes: ExcecaoEdicao[] = [];

  aba = signal<Aba>('geral');
  carregando = signal(false);
  salvando = signal(false);

  ufSimulacao = 'RJ';
  ncmSimulacao = '';
  simulando = signal(false);
  resultado = signal<TributacaoResolvida | null>(null);

  constructor(
    private service: NaturezasOperacaoService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const parametro = this.route.snapshot.paramMap.get('id');
    if (!parametro) return;

    this.id = Number(parametro);
    this.carregando.set(true);
    this.service.obter(this.id).subscribe({
      next: res => {
        this.n = res.dados!;
        this.excecoes = (res.dados!.excecoes ?? []).map(e => this.paraEdicao(e));
        this.carregando.set(false);
      },
      error: err => {
        this.carregando.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar a natureza de operação.');
        this.voltar();
      }
    });
  }

  alternar(campo: keyof NaturezaOperacaoDados) {
    const registro = this.n as unknown as Record<string, unknown>;
    registro[campo] = registro[campo] === 1 ? 0 : 1;
  }

  marcado(campo: keyof NaturezaOperacaoDados): boolean {
    return (this.n as unknown as Record<string, unknown>)[campo] === 1;
  }

  alternarPadrao(fluxo: string) {
    this.n.padraoPara = this.n.padraoPara === fluxo ? null : fluxo;
  }

  adicionarExcecao() {
    this.excecoes.push({
      tributo: 'icms', ufsTexto: '', ncmsTexto: '', cfop: '', situacaoTributaria: '',
      aliquota: null, baseReducao: null, prioridade: 0, ativo: 1
    });
  }

  removerExcecao(indice: number) {
    this.excecoes.splice(indice, 1);
  }

  alternarExcecaoAtiva(excecao: ExcecaoEdicao) {
    excecao.ativo = excecao.ativo === 1 ? 0 : 1;
  }

  salvar() {
    if (!this.n.descricao.trim()) {
      this.toast.erro('Informe a descrição da natureza de operação.');
      this.aba.set('geral');
      return;
    }

    const corpo: NaturezaOperacaoDados = { ...this.n, excecoes: this.excecoes.map(e => this.paraRequisicao(e)) };
    this.salvando.set(true);

    const chamada = this.id === null
      ? this.service.criar(corpo)
      : this.service.atualizar(this.id, corpo);

    chamada.subscribe({
      next: res => {
        this.salvando.set(false);
        this.toast.sucesso('Natureza de operação salva.');
        if (this.id === null) {
          this.router.navigate(['/fiscal/naturezas-operacao', res.dados!.id]);
          return;
        }
        this.n = res.dados!;
        this.excecoes = (res.dados!.excecoes ?? []).map(e => this.paraEdicao(e));
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar a natureza de operação.');
      }
    });
  }

  async excluir() {
    if (this.id === null) return;
    const confirmado = await this.confirm.confirmar('Excluir natureza de operação', 'A natureza e todas as suas exceções serão removidas.', { textoConfirmar: 'Excluir' });
    if (!confirmado) return;

    this.service.excluir(this.id).subscribe({
      next: () => {
        this.toast.sucesso('Natureza de operação excluída.');
        this.voltar();
      },
      error: err => this.toast.erroServidor(err, 'Não foi possível excluir a natureza de operação.')
    });
  }

  simular() {
    if (this.id === null) return;

    this.simulando.set(true);
    this.service.simular(this.id, this.ufSimulacao, this.ncmSimulacao.trim() || null).subscribe({
      next: res => {
        this.simulando.set(false);
        this.resultado.set(res.dados ?? null);
      },
      error: err => {
        this.simulando.set(false);
        this.resultado.set(null);
        this.toast.erroServidor(err, 'Não foi possível simular a tributação.');
      }
    });
  }

  voltar() {
    this.router.navigate(['/fiscal/naturezas-operacao']);
  }

  formatarTributo(tributo: TributoResolvido): string {
    const partes: string[] = [];
    if (tributo.situacaoTributaria) partes.push(tributo.situacaoTributaria);
    if (tributo.aliquota !== null) partes.push(`${tributo.aliquota}%`);
    if (tributo.baseReducao !== null) partes.push(`base ${tributo.baseReducao}%`);
    return partes.length ? partes.join(' · ') : '-';
  }

  private paraEdicao(excecao: NaturezaOperacaoExcecao): ExcecaoEdicao {
    return {
      tributo: excecao.tributo,
      ufsTexto: (excecao.ufsDestino ?? []).join(', '),
      ncmsTexto: (excecao.ncms ?? []).join(', '),
      cfop: excecao.cfop ?? '',
      situacaoTributaria: excecao.situacaoTributaria ?? '',
      aliquota: excecao.aliquota,
      baseReducao: excecao.baseReducao,
      prioridade: excecao.prioridade,
      ativo: excecao.ativo
    };
  }

  private paraRequisicao(excecao: ExcecaoEdicao): NaturezaOperacaoExcecao {
    return {
      tributo: excecao.tributo,
      ufsDestino: this.separar(excecao.ufsTexto),
      ncms: this.separar(excecao.ncmsTexto),
      cfop: excecao.cfop.trim() || null,
      situacaoTributaria: excecao.situacaoTributaria.trim() || null,
      aliquota: excecao.aliquota,
      baseReducao: excecao.baseReducao,
      prioridade: excecao.prioridade ?? 0,
      ativo: excecao.ativo
    };
  }

  private separar(texto: string): string[] | null {
    const itens = texto.split(/[\s,;]+/).map(i => i.trim()).filter(i => i.length > 0);
    return itens.length ? itens : null;
  }
}
