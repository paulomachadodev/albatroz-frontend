import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { AuthService } from '../../../../core/auth/auth.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';
import { ListagemPaginadaComponent } from '../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CategoriaArvoreNo } from '../../../../shared/models/categoria-arvore.model';
import { CategoriaService } from '../../../../shared/services/categoria.service';
import { PT_MULTISELECT } from '../../../../shared/utils/pt-multiselect';
import { PT_SELECT_FILTRO } from '../../../../shared/utils/pt-select-filtro';
import { PERFIL_SELECT_PT } from '../../../administracao/configuracoes/models/perfil-social.model';
import { ConexaoMetaService } from '../../../administracao/configuracoes/services/conexao-meta.service';
import { LinhaEditorial } from '../../models/marketing.model';
import { DIAS_DA_ROTINA, Rotina, RotinaRequisicao, formatarHorario, resumoDias } from '../../models/rotina.model';
import { MarketingService } from '../../services/marketing.service';
import { RotinasService } from '../../services/rotinas.service';

interface Destino { id: number; rotulo: string; }
interface OpcaoCategoria { id: number; rotulo: string; }

@Component({
  selector: 'app-rotinas-marketing', standalone: true,
  imports: [FormsModule, RouterLink, SelectModule, MultiSelectModule, BreadcrumbComponent, PageHeaderComponent, ListagemPaginadaComponent, DrawerComponent],
  templateUrl: './rotinas.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class RotinasMarketingComponent {
  private readonly service = inject(RotinasService);
  private readonly marketing = inject(MarketingService);
  private readonly conexao = inject(ConexaoMetaService);
  private readonly categoriasService = inject(CategoriaService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectPt = PERFIL_SELECT_PT;
  readonly selectFiltroPt = PT_SELECT_FILTRO;
  readonly multiselectPt = PT_MULTISELECT;
  readonly dias = DIAS_DA_ROTINA;
  readonly resumoDias = resumoDias;
  readonly formatarHorario = formatarHorario;
  readonly opcoesAntecedencia = [{ rotulo: '12 horas antes', valor: 12 }, { rotulo: '24 horas antes', valor: 24 }, { rotulo: '36 horas antes', valor: 36 }];
  readonly opcoesQuantidade = [1, 2, 3, 4, 5, 6, 8, 10].map(n => ({ rotulo: n + (n === 1 ? ' produto' : ' produtos'), valor: n }));

  readonly carregando = signal(true);
  readonly habilitado = signal(true);
  readonly itens = signal<Rotina[]>([]);
  readonly linhas = signal<LinhaEditorial[]>([]);
  readonly destinos = signal<Destino[]>([]);
  readonly categorias = signal<OpcaoCategoria[]>([]);
  readonly drawerAberto = signal(false);
  readonly salvando = signal(false);
  readonly editando = signal<Rotina | null>(null);

  nome = '';
  linha = '';
  ativoIds: number[] = [];
  diasSemana = 2 | 16;
  horario = '09:00';
  antecedencia = 24;
  categoriaId: number | null = null;
  quantidade = 4;
  marcarProdutos = false;
  ativa = true;

  readonly opcoesLinha = computed(() => this.linhas().map(l => ({ rotulo: l.nome, valor: l.nome })));
  readonly podeCriar = computed(() => this.auth.temPermissao('marketing:criar'));
  readonly podeEditar = computed(() => this.auth.temPermissao('marketing:editar'));

  constructor() {
    this.carregar();
    this.marketing.obterEstrategia().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => { if (res.dados?.habilitado) this.linhas.set(res.dados.linhas.filter(l => l.ativa)); },
      error: () => this.linhas.set([])
    });
    this.conexao.obterConexao().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const c = res.sucesso ? res.dados?.conexao : null;
        if (!c) return;
        this.destinos.set(c.ativos.filter(a => a.selecionado && (a.tipo === 1 ? c.podePublicarFacebook : c.podePublicarInstagram))
          .map(a => ({ id: a.id, rotulo: (a.tipo === 1 ? 'Facebook: ' : 'Instagram: ') + a.nome })));
      },
      error: () => this.destinos.set([])
    });
    this.categoriasService.listarArvore().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const opcoes: OpcaoCategoria[] = [];
        const achatar = (no: CategoriaArvoreNo) => {
          if (no.idCategoria !== null) opcoes.push({ id: no.idCategoria, rotulo: no.categoriaRaiz.split(' -> ').join(' > ') });
          no.filhos.forEach(achatar);
        };
        (res.dados ?? []).forEach(achatar);
        this.categorias.set(opcoes);
      },
      error: () => this.categorias.set([])
    });
  }

  usaProdutos(): boolean {
    const l = this.linhas().find(x => x.nome === this.linha);
    return !!l && (l.usaProdutos === true || /produto/i.test(l.nome));
  }

  alternarDia(bit: number): void {
    this.diasSemana = (this.diasSemana & bit) !== 0 ? this.diasSemana & ~bit : this.diasSemana | bit;
  }

  diaMarcado(bit: number): boolean {
    return (this.diasSemana & bit) !== 0;
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.carregando.set(false);
        if (res.sucesso && res.dados) { this.habilitado.set(res.dados.habilitado); this.itens.set(res.dados.itens); }
        else this.toast.erro('Não foi possível carregar as rotinas.');
      },
      error: erro => { this.carregando.set(false); this.toast.erroServidor(erro, 'Não foi possível carregar as rotinas.'); }
    });
  }

  abrirNova(): void {
    this.editando.set(null);
    this.nome = ''; this.linha = ''; this.ativoIds = this.destinos().map(d => d.id); this.diasSemana = 2 | 16; this.horario = '09:00';
    this.antecedencia = 24; this.categoriaId = null; this.quantidade = 4; this.marcarProdutos = false; this.ativa = true;
    this.drawerAberto.set(true);
  }

  abrirEdicao(rotina: Rotina): void {
    this.editando.set(rotina);
    this.nome = rotina.nome; this.linha = rotina.linha; this.ativoIds = [...rotina.ativoIds]; this.diasSemana = rotina.diasSemana;
    this.horario = formatarHorario(rotina.hora, rotina.minuto); this.antecedencia = rotina.antecedenciaHoras;
    this.categoriaId = rotina.categoriaId; this.quantidade = rotina.quantidadeProdutos; this.marcarProdutos = rotina.marcarProdutos; this.ativa = rotina.ativa;
    this.drawerAberto.set(true);
  }

  fechar(): void {
    if (!this.salvando()) this.drawerAberto.set(false);
  }

  salvar(): void {
    if (this.salvando()) return;
    const [hora, minuto] = this.horario.split(':').map(Number);
    if (!this.nome.trim() || !this.linha) { this.toast.aviso('Informe o nome e o tipo da rotina.'); return; }
    if (this.diasSemana === 0) { this.toast.aviso('Escolha pelo menos um dia.'); return; }
    if (this.ativoIds.length === 0) { this.toast.aviso('Escolha onde publicar.'); return; }
    if (Number.isNaN(hora) || Number.isNaN(minuto)) { this.toast.aviso('Informe o horário.'); return; }
    if (this.usaProdutos() && !this.categoriaId) { this.toast.aviso('Escolha a categoria dos produtos.'); return; }
    const emEdicao = this.editando();
    const requisicao: RotinaRequisicao = {
      nome: this.nome.trim(), linha: this.linha, usaProdutos: this.usaProdutos(), categoriaId: this.usaProdutos() ? this.categoriaId : null,
      quantidadeProdutos: this.quantidade, marcarProdutos: this.usaProdutos() && this.marcarProdutos, diasSemana: this.diasSemana, hora, minuto,
      antecedenciaHoras: this.antecedencia, ativa: this.ativa, ativoIds: this.ativoIds, versaoEsperada: emEdicao?.versao ?? null
    };
    this.salvando.set(true);
    const chamada = emEdicao ? this.service.atualizar(emEdicao.id, requisicao) : this.service.criar(requisicao);
    chamada.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.salvando.set(false);
        if (!res.sucesso) { this.toast.erro('Não foi possível salvar a rotina.'); return; }
        this.toast.sucesso('Rotina salva.');
        this.drawerAberto.set(false);
        this.carregar();
      },
      error: erro => { this.salvando.set(false); this.toast.erroServidor(erro, 'Não foi possível salvar a rotina.'); }
    });
  }

  async alternarAtiva(rotina: Rotina): Promise<void> {
    if (!this.podeEditar()) return;
    const requisicao: RotinaRequisicao = {
      nome: rotina.nome, linha: rotina.linha, usaProdutos: rotina.usaProdutos, categoriaId: rotina.categoriaId, quantidadeProdutos: rotina.quantidadeProdutos,
      marcarProdutos: rotina.marcarProdutos, diasSemana: rotina.diasSemana, hora: rotina.hora, minuto: rotina.minuto, antecedenciaHoras: rotina.antecedenciaHoras,
      ativa: !rotina.ativa, ativoIds: rotina.ativoIds, versaoEsperada: rotina.versao
    };
    try {
      const res = await firstValueFrom(this.service.atualizar(rotina.id, requisicao));
      if (!res.sucesso) this.toast.erro('Não foi possível alterar a rotina.');
    } catch (erro) {
      this.toast.erroServidor(erro, 'Não foi possível alterar a rotina.');
    }
    this.carregar();
  }

  async remover(rotina: Rotina): Promise<void> {
    if (!this.podeEditar()) return;
    const confirmado = await this.confirm.confirmar('Remover esta rotina?', 'As postagens já agendadas continuam. A rotina deixa de preparar novas.', { textoConfirmar: 'Remover', textoCancelar: 'Voltar' });
    if (!confirmado) return;
    try {
      const res = await firstValueFrom(this.service.remover(rotina.id));
      if (res.sucesso) { this.toast.sucesso('Rotina removida.'); this.drawerAberto.set(false); }
      else this.toast.erro('Não foi possível remover a rotina.');
    } catch (erro) {
      this.toast.erroServidor(erro, 'Não foi possível remover a rotina.');
    }
    this.carregar();
  }
}
