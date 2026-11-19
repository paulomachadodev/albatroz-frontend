import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SelectBuscaMultiComponent } from '../../../../shared/components/select-busca-multi/select-busca-multi.component';
import { OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { PT_MULTISELECT } from '../../../../shared/utils/pt-multiselect';
import { CategoriaService } from '../../../../shared/services/categoria.service';
import { CategoriaArvoreNo } from '../../../../shared/models/categoria-arvore.model';
import { PERFIL_SELECT_PT } from '../../../administracao/configuracoes/models/perfil-social.model';
import { ConexaoMetaService } from '../../../administracao/configuracoes/services/conexao-meta.service';
import { ProdutosService } from '../../../produtos/services/produtos.service';
import { Agendamento } from '../../models/agendamento.model';
import { DIAS_SEMANA, proximaOcorrencia } from '../../models/insights.model';
import { InsightsService } from '../../services/insights.service';
import { Arte } from '../../models/arte.model';
import { LinhaEditorial } from '../../models/marketing.model';
import { Peca } from '../../models/peca.model';
import { Publicacao, STATUS_PUBLICACAO } from '../../models/publicacao.model';
import { AgendamentosService } from '../../services/agendamentos.service';
import { ArtesService } from '../../services/artes.service';
import { GeracoesMarketingService } from '../../services/geracoes-marketing.service';
import { MarketingService } from '../../services/marketing.service';
import { PecasService } from '../../services/pecas.service';
import { PublicacoesService } from '../../services/publicacoes.service';

interface Destino { id: number; tipo: number; rotulo: string; }
interface OpcaoCategoria { id: number; rotulo: string; }

const TITULOS_PASSO = ['Tipo de postagem', 'Onde publicar', 'Produtos', 'Texto', 'Arte', 'Quando publicar'];
const ESPERA_GERACAO_MS = 3000;
const TENTATIVAS_GERACAO = 60;

@Component({
  selector: 'app-criar-postagem', standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, SelectModule, MultiSelectModule, BreadcrumbComponent, PageHeaderComponent, SelectBuscaMultiComponent],
  templateUrl: './criar-postagem.component.html', host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class CriarPostagemComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly marketing = inject(MarketingService);
  private readonly geracoes = inject(GeracoesMarketingService);
  private readonly pecas = inject(PecasService);
  private readonly artesService = inject(ArtesService);
  private readonly publicacoes = inject(PublicacoesService);
  private readonly agendamentos = inject(AgendamentosService);
  private readonly conexao = inject(ConexaoMetaService);
  private readonly categoriasService = inject(CategoriaService);
  private readonly produtosService = inject(ProdutosService);
  private readonly insights = inject(InsightsService);
  readonly sugestaoHorario = signal('');
  readonly sugestaoConfiavel = signal(false);

  readonly selectPt = PERFIL_SELECT_PT;
  readonly multiselectPt = PT_MULTISELECT;
  readonly selectCategoriaPt = {
    ...PERFIL_SELECT_PT,
    overlay: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg mt-1 z-50 overflow-hidden',
    header: 'p-2 border-b border-slate-100 dark:border-slate-700',
    pcFilter: { root: 'w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm outline-none' },
    list: 'py-1 max-h-64 overflow-y-auto'
  };
  readonly titulosPasso = TITULOS_PASSO;
  readonly statusPublicacao = STATUS_PUBLICACAO;
  readonly buscarProdutos = this.marketing.buscarProdutos;

  readonly passo = signal(1);
  readonly trabalhando = signal(false);
  readonly mensagemTrabalho = signal('');
  readonly erro = signal('');

  readonly linhas = signal<LinhaEditorial[]>([]);
  readonly linhaNome = signal('');
  readonly assunto = signal('');
  readonly destinos = signal<Destino[]>([]);
  readonly destinoIds = signal<number[]>([]);
  readonly podeMarcarProdutos = signal(false);
  readonly marcarProdutos = signal(true);
  readonly modoProdutos = signal<'escolher' | 'sortear'>('escolher');
  readonly produtos = signal<OpcaoSelectBusca[]>([]);
  readonly categorias = signal<OpcaoCategoria[]>([]);
  readonly categoriaId = signal(0);
  readonly quantidade = signal(4);
  readonly sorteando = signal(false);

  readonly briefingId = signal(0);
  readonly geracaoId = signal('');
  readonly peca = signal<Peca | null>(null);
  readonly legenda = signal('');
  readonly cta = signal('');
  readonly hashtags = signal('');
  readonly artes = signal<Arte[]>([]);
  readonly quando = signal<'agora' | 'agendar'>('agora');
  readonly dataHora = signal('');
  readonly publicadas = signal<Publicacao[]>([]);
  readonly agendadas = signal<Agendamento[]>([]);
  readonly concluido = signal(false);

  readonly opcoesLinha = computed(() => this.linhas().map(l => ({ rotulo: l.nome, valor: l.nome })));
  readonly opcoesQuantidade = [1, 2, 3, 4, 5, 6, 8, 10].map(n => ({ rotulo: n + (n === 1 ? ' produto' : ' produtos'), valor: n }));
  readonly podeCriar = computed(() => this.auth.temPermissao('marketing:criar') && this.auth.temPermissao('marketing:editar'));
  readonly podeAprovar = computed(() => this.auth.temPermissao('marketing:aprovar'));
  readonly instagramEscolhido = computed(() => this.destinos().some(d => d.tipo === 2 && this.destinoIds().includes(d.id)));
  readonly oferecerMarcacao = computed(() => this.podeMarcarProdutos() && this.instagramEscolhido() && this.produtos().length > 0);
  readonly artesAtivas = computed(() => this.artes().filter(a => a.status !== 3));
  readonly artesAprovadas = computed(() => this.artes().filter(a => a.status === 2 && a.arquivoDisponivel));
  readonly minimoAgendamento = computed(() => this.paraCampoData(new Date(Date.now() + 5 * 60000)));
  readonly usaProdutos = computed(() => {
    const linha = this.linhas().find(l => l.nome === this.linhaNome());
    return !!linha && (linha.usaProdutos === true || /produto/i.test(linha.nome));
  });
  readonly totalPassos = computed(() => (this.usaProdutos() ? 6 : 5));
  readonly numeroPasso = computed(() => (!this.usaProdutos() && this.passo() > 3 ? this.passo() - 1 : this.passo()));
  readonly progresso = computed(() => Math.round((Math.min(this.numeroPasso(), this.totalPassos()) / this.totalPassos()) * 100));

  constructor() {
    this.carregarLinhas();
    this.carregarDestinos();
    this.carregarCategorias();
    this.dataHora.set(this.paraCampoData(new Date(Date.now() + 60 * 60000)));
  }

  trocarModo(modo: 'escolher' | 'sortear'): void {
    this.modoProdutos.set(modo);
    this.produtos.set([]);
  }

  voltar(): void {
    if (this.trabalhando() || this.passo() <= 1) return;
    this.erro.set('');
    this.passo.update(p => (p === 4 && !this.usaProdutos() ? 2 : p - 1));
  }

  continuarTipo(): void {
    if (!this.linhaNome()) { this.toast.aviso('Escolha o tipo de postagem.'); return; }
    if (!this.usaProdutos() && !this.assunto().trim()) { this.toast.aviso('Informe o assunto da postagem.'); return; }
    this.passo.set(2);
  }

  async continuarOnde(): Promise<void> {
    if (this.destinoIds().length === 0) { this.toast.aviso('Escolha onde publicar.'); return; }
    if (this.usaProdutos()) { this.passo.set(3); return; }
    this.produtos.set([]);
    this.passo.set(4);
    await this.prepararTexto();
  }

  async sortear(): Promise<void> {
    if (!this.categoriaId()) { this.toast.aviso('Escolha a categoria.'); return; }
    this.sorteando.set(true);
    try {
      const res = await firstValueFrom(this.produtosService.listar({ pagina: 1, tamanho: 60 }, { idCategoria: this.categoriaId(), temImagem: true, comEstoque: true }));
      const lista = res.sucesso && res.dados ? res.dados.dados : [];
      if (lista.length === 0) { this.toast.aviso('Nenhum produto com foto e estoque nesta categoria.'); this.produtos.set([]); return; }
      const embaralhada = [...lista].sort(() => Math.random() - 0.5).slice(0, this.quantidade());
      this.produtos.set(embaralhada.map(p => ({ id: p.id, nome: `${p.nome} (${p.codigo})`, imagem: p.urlImagemPrincipal ?? null })));
    } catch (erro) {
      this.toast.erroServidor(erro, 'Não foi possível sortear os produtos.');
    } finally {
      this.sorteando.set(false);
    }
  }

  async continuarProdutos(): Promise<void> {
    if (this.produtos().length === 0 && !this.assunto().trim()) { this.toast.aviso('Escolha produtos ou informe o assunto.'); return; }
    this.passo.set(4);
    await this.prepararTexto();
  }

  async prepararTexto(): Promise<void> {
    this.erro.set('');
    this.trabalhando.set(true);
    try {
      if (this.briefingId() === 0) await this.criarBriefing();
      if (!this.geracaoId()) await this.gerarTexto();
      if (!this.peca()) await this.criarPeca();
    } catch (falha) {
      this.erro.set(falha instanceof Error ? falha.message : 'Não foi possível preparar o texto.');
    } finally {
      this.trabalhando.set(false);
      this.mensagemTrabalho.set('');
    }
  }

  async aprovarTexto(): Promise<void> {
    const atual = this.peca();
    if (!atual || this.trabalhando()) return;
    if (!this.podeAprovar()) { this.toast.aviso('Você não tem permissão para aprovar.'); return; }
    this.erro.set('');
    this.trabalhando.set(true);
    this.mensagemTrabalho.set('Aprovando o texto...');
    try {
      let corrente = atual;
      if (this.mudouTexto(corrente)) {
        const salva = await firstValueFrom(this.pecas.salvarConteudo(corrente.id, this.conteudoAtual(), corrente.versao));
        if (!salva.sucesso || !salva.dados) throw new Error('Não foi possível salvar o texto.');
        corrente = salva.dados;
      }
      const aprovada = await firstValueFrom(this.pecas.aprovar(corrente.id, corrente.versao, corrente.versaoAtual));
      if (!aprovada.sucesso || !aprovada.dados) throw new Error('Não foi possível aprovar o texto.');
      this.peca.set(aprovada.dados);
      this.passo.set(5);
      await this.prepararArtes();
    } catch (falha) {
      this.erro.set(falha instanceof Error ? falha.message : 'Não foi possível aprovar o texto.');
    } finally {
      this.trabalhando.set(false);
      this.mensagemTrabalho.set('');
    }
  }

  async prepararArtes(): Promise<void> {
    const atual = this.peca();
    if (!atual) return;
    this.erro.set('');
    this.trabalhando.set(true);
    this.mensagemTrabalho.set('Criando as artes...');
    try {
      if (this.artes().length === 0) {
        const titulo = (this.assunto().trim() || this.linhaNome()).slice(0, 70);
        const criacao = this.produtos().length > 0
          ? await firstValueFrom(this.artesService.gerarCarrosselProdutos(atual.id, { formato: 2, modelo: 1, titulo, subtitulo: '' }))
          : await firstValueFrom(this.artesService.gerar(atual.id, { formato: 2, modelo: 3, produtoId: null, titulo, subtitulo: '' }));
        if (!criacao.sucesso) throw new Error('Não foi possível criar as artes.');
      }
      await this.recarregarArtes();
    } catch (falha) {
      this.erro.set(falha instanceof Error ? falha.message : 'Não foi possível criar as artes.');
    } finally {
      this.trabalhando.set(false);
      this.mensagemTrabalho.set('');
    }
  }

  async removerArte(arte: Arte): Promise<void> {
    const atual = this.peca();
    if (!atual || this.trabalhando()) return;
    this.trabalhando.set(true);
    try {
      await firstValueFrom(this.artesService.descartar(atual.id, arte.id, arte.versao));
      await this.recarregarArtes();
    } catch (erro) {
      this.toast.erroServidor(erro, 'Não foi possível remover a arte.');
    } finally {
      this.trabalhando.set(false);
    }
  }

  async aprovarArtes(): Promise<void> {
    const atual = this.peca();
    const lista = this.artesAtivas().filter(a => a.status === 1 && a.arquivoDisponivel);
    if (!atual || this.trabalhando()) return;
    if (!this.podeAprovar()) { this.toast.aviso('Você não tem permissão para aprovar.'); return; }
    this.erro.set('');
    this.trabalhando.set(true);
    this.mensagemTrabalho.set('Aprovando as artes...');
    try {
      for (const arte of lista) {
        const res = await firstValueFrom(this.artesService.aprovar(atual.id, arte.id, arte.versao));
        if (!res.sucesso) throw new Error('Não foi possível aprovar uma das artes.');
      }
      await this.recarregarArtes();
      if (this.artesAprovadas().length === 0) throw new Error('Nenhuma arte aprovada.');
      this.passo.set(6);
      await this.carregarSugestaoHorario();
    } catch (falha) {
      this.erro.set(falha instanceof Error ? falha.message : 'Não foi possível aprovar as artes.');
    } finally {
      this.trabalhando.set(false);
      this.mensagemTrabalho.set('');
    }
  }

  async finalizar(): Promise<void> {
    const atual = this.peca();
    const escolhidos = this.destinos().filter(d => this.destinoIds().includes(d.id));
    if (!atual || this.trabalhando() || escolhidos.length === 0) return;
    if (!this.podeAprovar()) { this.toast.aviso('Você não tem permissão para publicar.'); return; }
    const agendar = this.quando() === 'agendar';
    const data = new Date(this.dataHora());
    if (agendar && (Number.isNaN(data.getTime()) || data.getTime() < Date.now() + 2 * 60000)) { this.toast.aviso('Escolha um horário com pelo menos 2 minutos de antecedência.'); return; }
    this.erro.set('');
    this.trabalhando.set(true);
    this.mensagemTrabalho.set(agendar ? 'Agendando...' : 'Publicando...');
    try {
      const marcar = this.oferecerMarcacao() && this.marcarProdutos();
      if (agendar) {
        const res = await firstValueFrom(this.agendamentos.agendar(atual.id, { ativoIds: escolhidos.map(d => d.id), agendadaPara: data.toISOString(), marcarProdutos: marcar }));
        if (!res.sucesso) throw new Error('Não foi possível agendar.');
        const lista = await firstValueFrom(this.agendamentos.listar(atual.id));
        const mapa = new Set(escolhidos.map(d => d.id));
        this.agendadas.set((lista.dados?.itens ?? []).filter(a => a.status === 1 && mapa.has(a.ativoId)));
        if (this.agendadas().length === 0) throw new Error('O agendamento não foi encontrado depois de salvar. Confira em Peças.');
      } else {
        const artes = this.artesAprovadas().slice(0, 10).map(a => a.id);
        for (const destino of escolhidos) {
          const res = await firstValueFrom(this.publicacoes.publicar(atual.id, { ativoId: destino.id, arteIds: artes, marcarProdutos: marcar && destino.tipo === 2 }));
          for (const aviso of res.dados?.avisos ?? []) this.toast.aviso(aviso);
          if (!res.sucesso) throw new Error('Não foi possível publicar em ' + destino.rotulo + '.');
        }
        const lista = await firstValueFrom(this.publicacoes.listar(atual.id));
        this.publicadas.set((lista.dados?.itens ?? []).slice(0, escolhidos.length));
      }
      this.concluido.set(true);
    } catch (falha) {
      this.erro.set(falha instanceof Error ? falha.message : 'Não foi possível concluir.');
    } finally {
      this.trabalhando.set(false);
      this.mensagemTrabalho.set('');
    }
  }

  nomeDestino(ativoId: number): string {
    return this.destinos().find(d => d.id === ativoId)?.rotulo ?? 'Destino';
  }

  recomecar(): void {
    window.location.reload();
  }

  private async carregarSugestaoHorario(): Promise<void> {
    try {
      const res = await firstValueFrom(this.insights.obterInstagram(30));
      const melhor = res.sucesso ? res.dados?.horarios?.[0] : undefined;
      if (!melhor) return;
      this.dataHora.set(this.paraCampoData(proximaOcorrencia(melhor)));
      const confiavel = melhor.amostra >= 2;
      if (confiavel) this.quando.set('agendar');
      this.sugestaoHorario.set(`${DIAS_SEMANA[melhor.diaSemana]}, ${melhor.horaInicio}h às ${melhor.horaFim}h (confiança ${melhor.confianca.toLowerCase()}, ${melhor.amostra} post(s))`);
      this.sugestaoConfiavel.set(confiavel);
    } catch {
      this.sugestaoHorario.set('');
    }
  }

  private async criarBriefing(): Promise<void> {
    const linha = this.linhas().find(l => l.nome === this.linhaNome());
    const redes = [...new Set(this.destinos().filter(d => this.destinoIds().includes(d.id)).map(d => (d.tipo === 1 ? 'Facebook' : 'Instagram')))];
    const assunto = this.assunto().trim() || this.linhaNome();
    const dados = {
      produtoIds: this.produtos().map(p => Number(p.id)),
      objetivo: linha?.objetivo?.trim() || 'Divulgar ' + this.linhaNome(),
      publico: '', linha: this.linhaNome(), assunto, produtoServico: '', oferta: '',
      formato: this.produtos().length > 1 ? 'Carrossel' : 'Post',
      rede: redes.join(','), referencias: '', prazo: null
    };
    this.mensagemTrabalho.set('Preparando o pedido...');
    const criado = await firstValueFrom(this.marketing.criarBriefing(dados));
    if (!criado.sucesso || !criado.dados) throw new Error('Não foi possível criar o pedido.');
    const { id, versao } = criado.dados;
    const confirmado = await firstValueFrom(this.marketing.atualizarBriefing(id, { ...dados, status: 2, versaoEsperada: versao }));
    if (!confirmado.sucesso) throw new Error('Não foi possível confirmar o pedido.');
    this.briefingId.set(id);
  }

  private async gerarTexto(): Promise<void> {
    this.mensagemTrabalho.set('A IA está escrevendo o texto...');
    const inicio = await firstValueFrom(this.geracoes.gerar(this.briefingId(), crypto.randomUUID()));
    if (!inicio.sucesso || !inicio.dados) throw new Error('Não foi possível pedir o texto à IA.');
    let atual = inicio.dados;
    for (let i = 0; i < TENTATIVAS_GERACAO && atual.status !== 3; i++) {
      if (atual.status >= 4) throw new Error(atual.erro || 'A IA não conseguiu escrever o texto. Tente de novo.');
      await new Promise(resolver => setTimeout(resolver, ESPERA_GERACAO_MS));
      const consulta = await firstValueFrom(this.geracoes.obter(atual.id));
      if (consulta.sucesso && consulta.dados) atual = consulta.dados;
    }
    if (atual.status !== 3 || !atual.resultado) throw new Error('O texto demorou demais. Tente de novo.');
    this.geracaoId.set(atual.id);
  }

  private async criarPeca(): Promise<void> {
    this.mensagemTrabalho.set('Montando a postagem...');
    const res = await firstValueFrom(this.pecas.criar(this.geracaoId()));
    if (!res.sucesso || !res.dados) throw new Error('Não foi possível montar a postagem.');
    this.peca.set(res.dados);
    this.legenda.set(res.dados.conteudo.legenda);
    this.cta.set(res.dados.conteudo.cta);
    this.hashtags.set(res.dados.conteudo.hashtags.join(' '));
  }

  private conteudoAtual() {
    const base = this.peca()!.conteudo;
    return {
      ...base,
      legenda: this.legenda().trim(),
      cta: this.cta().trim(),
      hashtags: this.hashtags().split(/\s+/).map(h => h.trim()).filter(h => h.length > 0)
    };
  }

  private mudouTexto(peca: Peca): boolean {
    const novo = this.conteudoAtual();
    return novo.legenda !== peca.conteudo.legenda || novo.cta !== peca.conteudo.cta || novo.hashtags.join(' ') !== peca.conteudo.hashtags.join(' ');
  }

  private async recarregarArtes(): Promise<void> {
    const atual = this.peca();
    if (!atual) return;
    const res = await firstValueFrom(this.artesService.listar(atual.id));
    if (!res.sucesso || !res.dados) throw new Error('Não foi possível carregar as artes.');
    this.artes.set(res.dados.itens);
  }

  private carregarLinhas(): void {
    this.marketing.obterEstrategia().subscribe({
      next: res => {
        const estrategia = res.dados;
        if (estrategia?.habilitado) this.linhas.set(estrategia.linhas.filter(l => l.ativa));
      },
      error: () => this.linhas.set([])
    });
  }

  private carregarDestinos(): void {
    this.conexao.obterConexao().subscribe({
      next: res => {
        const conexao = res.sucesso ? res.dados?.conexao : null;
        if (!conexao) return;
        this.podeMarcarProdutos.set(conexao.podeMarcarProdutos === true);
        const lista = conexao.ativos
          .filter(a => a.selecionado && (a.tipo === 1 ? conexao.podePublicarFacebook : conexao.podePublicarInstagram))
          .map(a => ({ id: a.id, tipo: a.tipo, rotulo: (a.tipo === 1 ? 'Facebook: ' : 'Instagram: ') + a.nome }));
        this.destinos.set(lista);
        this.destinoIds.set(lista.map(d => d.id));
      },
      error: () => this.destinos.set([])
    });
  }

  private carregarCategorias(): void {
    this.categoriasService.listarArvore().subscribe({
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

  private paraCampoData(data: Date): string {
    const ajustada = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return ajustada.toISOString().slice(0, 16);
  }
}
