import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContagemSessaoService } from '../../services/contagem-sessao.service';
import { ContagemSessaoDetalhe, ContagemSessaoResumo, StatusContagemSessao } from '../../models/contagem-estoque.model';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { formatarDataHora } from '../../../../shared/utils/formatar-data-hora.util';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-contagem-sessoes-lista',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent, ListagemPaginadaComponent],
  templateUrl: './contagem-sessoes-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContagemSessoesListaComponent implements OnInit {
  carregando = signal(true);
  sessoes = signal<ContagemSessaoResumo[]>([]);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  totalRegistros = signal(0);
  tamanhoPagina = signal(10);

  filtroStatus: StatusContagemSessao = 'emRevisao';
  verTodas = false;

  sessaoExpandidaId = signal<number | null>(null);
  detalheExpandido = signal<ContagemSessaoDetalhe | null>(null);
  carregandoDetalhe = signal(false);

  processando = signal(false);

  private auth = inject(AuthService);

  podeEfetivar(): boolean {
    return this.auth.temPermissao('estoque:aprovar');
  }

  constructor(
    private contagemSessaoService: ContagemSessaoService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.sessaoExpandidaId.set(null);
    this.contagemSessaoService.listar({ pagina, tamanho: this.tamanhoPagina() }, [this.filtroStatus], this.verTodas).subscribe({
      next: res => {
        this.sessoes.set(res.dados?.dados ?? []);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as contagens.');
        this.carregando.set(false);
      }
    });
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  alternarExpandir(sessao: ContagemSessaoResumo) {
    if (this.sessaoExpandidaId() === sessao.id) {
      this.sessaoExpandidaId.set(null);
      this.detalheExpandido.set(null);
      return;
    }

    this.sessaoExpandidaId.set(sessao.id);
    this.carregandoDetalhe.set(true);
    this.contagemSessaoService.obterDetalhe(sessao.id).subscribe({
      next: res => {
        this.detalheExpandido.set(res.dados ?? null);
        this.carregandoDetalhe.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar os itens dessa contagem.');
        this.carregandoDetalhe.set(false);
      }
    });
  }

  async efetivar(sessao: ContagemSessaoResumo) {
    const confirmou = await this.confirm.confirmar(
      'Efetivar contagem',
      `Isso vai aplicar as ${sessao.qtdItens} quantidade(s) contada(s) direto no estoque. Confirma?`,
      { textoConfirmar: 'Efetivar' }
    );
    if (!confirmou) return;

    this.processando.set(true);
    this.contagemSessaoService.efetivar(sessao.id).subscribe({
      next: res => {
        this.processando.set(false);
        this.toast.sucesso('Contagem efetivada.', `${res.dados?.produtosAplicados ?? 0} produto(s) atualizado(s) no estoque.`);
        this.carregar(1);
      },
      error: err => {
        this.processando.set(false);
        this.toast.erroServidor(err, 'Não foi possível efetivar essa contagem.');
      }
    });
  }

  async desfazer(sessao: ContagemSessaoResumo) {
    const confirmou = await this.confirm.confirmar(
      'Desfazer efetivação',
      'Isso reverte o saldo dos produtos dessa contagem no estoque. Produtos alterados por outro processo (sincronização Tiny, outra contagem) depois da efetivação não serão revertidos automaticamente. Confirma?',
      { textoConfirmar: 'Desfazer', textoCancelar: 'Cancelar' }
    );
    if (!confirmou) return;

    this.processando.set(true);
    this.contagemSessaoService.desfazer(sessao.id).subscribe({
      next: res => {
        this.processando.set(false);
        const dados = res.dados;
        if (dados && dados.bloqueadosPorDivergencia > 0) {
          this.toast.sucesso('Estorno parcial.', `${dados.estornados} revertido(s), ${dados.bloqueadosPorDivergencia} bloqueado(s) por divergência — ajuste manual necessário.`);
        } else {
          this.toast.sucesso('Contagem desfeita.', `${dados?.estornados ?? 0} produto(s) revertido(s) no estoque.`);
        }
        this.carregar(1);
      },
      error: err => {
        this.processando.set(false);
        this.toast.erroServidor(err, 'Não foi possível desfazer essa contagem.');
      }
    });
  }

  async cancelar(sessao: ContagemSessaoResumo) {
    const confirmou = await this.confirm.confirmar(
      'Cancelar contagem',
      'Isso encerra essa contagem sem aplicar nada no estoque. Os itens já bipados ficam registrados como histórico, mas não contam mais pra nada. Confirma?',
      { textoConfirmar: 'Cancelar contagem', textoCancelar: 'Voltar' }
    );
    if (!confirmou) return;

    this.processando.set(true);
    this.contagemSessaoService.cancelar(sessao.id).subscribe({
      next: () => {
        this.processando.set(false);
        this.toast.sucesso('Contagem cancelada.');
        this.carregar(1);
      },
      error: err => {
        this.processando.set(false);
        this.toast.erroServidor(err, 'Não foi possível cancelar essa contagem.');
      }
    });
  }

  async excluir(sessao: ContagemSessaoResumo) {
    const confirmou = await this.confirm.confirmar(
      'Excluir contagem',
      'Isso apaga essa contagem de vez, sem deixar histórico — os itens já bipados somem junto. Use só pra sessão de teste/engano. Confirma?',
      { textoConfirmar: 'Excluir de vez', textoCancelar: 'Voltar' }
    );
    if (!confirmou) return;

    this.processando.set(true);
    this.contagemSessaoService.excluir(sessao.id).subscribe({
      next: () => {
        this.processando.set(false);
        this.toast.sucesso('Contagem excluída.');
        this.carregar(1);
      },
      error: err => {
        this.processando.set(false);
        this.toast.erroServidor(err, 'Não foi possível excluir essa contagem.');
      }
    });
  }

  formatarDataHora = formatarDataHora;

  rotuloStatus(status: StatusContagemSessao): string {
    return status === 'aberta' ? 'Em andamento'
      : status === 'emRevisao' ? 'Aguardando efetivação'
      : status === 'efetivada' ? 'Efetivada'
      : status === 'desfeita' ? 'Desfeita'
      : 'Cancelada';
  }

  rotuloModo(sessao: ContagemSessaoResumo): string {
    const base = sessao.modo === 'prioridade' ? 'Prioridade'
      : sessao.modo === 'categoria' ? 'Categoria'
      : sessao.modo === 'marca' ? 'Marca'
      : sessao.modo === 'livre' ? 'Livre'
      : 'Filtrada';
    return sessao.categoriaRaiz ? `${base} — ${sessao.categoriaRaiz}` : sessao.marcaNome ? `${base} — ${sessao.marcaNome}` : base;
  }
}
