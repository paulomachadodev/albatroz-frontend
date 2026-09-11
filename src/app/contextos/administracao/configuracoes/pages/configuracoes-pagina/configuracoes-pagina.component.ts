import { Component, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfiguracoesService } from '../../services/configuracoes.service';
import { VendedoresService } from '../../services/vendedores.service';
import { CondicoesComerciaisService } from '../../../../cotacao/configuracoes/services/condicoes-comerciais.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { environment } from '../../../../../../environments/environment';
import { Configuracao } from '../../models/configuracao.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ProdutosService } from '../../../../produtos/services/produtos.service';
import { ListaPreco } from '../../../../produtos/models/produto.model';
import { CriarListaPrecoRequisicao, AtualizarListaPrecoRequisicao } from '../../../../produtos/dtos/produto-requisicao.dto';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CampoHintComponent } from '../../../../../shared/components/campo-hint/campo-hint.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';

type Aba = 'email' | 'venda' | 'integracoes' | 'busca-imagens' | 'metas' | 'condicoes-comerciais';
type ModoMeta = 'valor' | 'percentual';

interface RegraMeta {
  modo: ModoMeta;
  valor: number;
  percentual: number;
}

interface OverrideMeta extends RegraMeta {
  chave: string;
  mes: string;
}

interface VendedorMeta {
  id: number;
  nome: string;
  vendaRecente: boolean;
  meta: number;
}

@Component({
  selector: 'app-configuracoes-pagina',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, ModalComponent, CampoHintComponent, BreadcrumbComponent],
  templateUrl: './configuracoes-pagina.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ConfiguracoesPaginaComponent implements OnInit {
  abaAtiva = signal<Aba>('email');
  carregando = signal(true);
  salvando = signal(false);

  smtpHost = '';
  smtpPort = '465';
  smtpSsl = true;
  smtpUsuario = '';
  smtpSenha = '';
  smtpRemetente = '';
  smtpNomeRemetente = '';
  senhaJaConfigurada = false;

  // ---- Integrações (Google Merchant Center / Meta Catalog) ----
  googleMerchantId = '';
  googleFeedModo: 'url' | 'api' = 'url';
  googleServiceAccountJson = '';
  googleFeedToken = '';
  metaCatalogId = '';
  metaFeedModo: 'url' | 'api' = 'url';
  metaTokenSistema = '';
  metaFeedToken = '';
  siteBaseUrl = '';
  salvandoIntegracoes = signal(false);

  // ---- Busca de imagens (Google Custom Search) ----
  googleCustomSearchApiKey = '';
  googleCustomSearchChaveConfigurada = false;
  googleCustomSearchEngineId = '';
  googleCustomSearchLimiteDiario = '100';
  salvandoBuscaImagens = signal(false);

  // ---- Venda: listas de preço ----
  listasPreco = signal<ListaPreco[]>([]);
  carregandoListas = signal(false);
  modalListaAberto = signal(false);
  listaEditandoId: number | null = null;
  formLista: { codigo: string; nome: string; tipo: string; modoCalculo: 'percentual_venda' | 'percentual_custo'; percentual: number; ativo: boolean } = {
    codigo: '', nome: '', tipo: 'empresa', modoCalculo: 'percentual_venda', percentual: 0, ativo: true
  };
  salvandoLista = signal(false);

  // ---- Metas ----
  metaRegraModo: ModoMeta = 'valor';
  metaRegraValor = 0;
  metaRegraPercentual = 20;
  salvandoMetaRegra = signal(false);

  metaFallbackValor = '';
  salvandoMetaFallback = signal(false);

  metaOverrides = signal<OverrideMeta[]>([]);
  novoOverrideMes = '';
  novoOverrideModo: ModoMeta = 'valor';
  novoOverrideValor = 0;
  novoOverridePercentual = 20;
  salvandoOverride = signal(false);
  removendoOverrideChave: string | null = null;

  vendedoresMetas = signal<VendedorMeta[]>([]);
  carregandoVendedores = signal(false);
  salvandoMetasVendedores = signal(false);
  private metasVendedoresMapa: Record<string, number> = {};

  carregandoCondicoesComerciais = signal(true);
  salvandoCondicoesComerciais = signal(false);
  condicoesComerciaisCadastradas = signal(false);
  parcelaMinimaValor = 40;
  parcelasMaximas = 6;
  descontoPixDinheiroPercentual = 5;
  descontoEscolaParceiraPercentual = 10;

  // Percentual sempre assinado no backend (+ acréscimo / - desconto) — na UI vira
  // dropdown Soma/Diminui + número sem sinal, o "%" só aparece na exibição depois de salvo.
  formListaOperacao: 'soma' | 'diminui' = 'soma';
  get formListaPercentualAbsoluto(): number {
    return Math.abs(this.formLista.percentual);
  }
  set formListaPercentualAbsoluto(valor: number) {
    const absoluto = Math.abs(valor || 0);
    this.formLista.percentual = this.formListaOperacao === 'diminui' ? -absoluto : absoluto;
  }

  constructor(
    private configuracoesService: ConfiguracoesService,
    private produtosService: ProdutosService,
    private vendedoresService: VendedoresService,
    private condicoesComerciaisService: CondicoesComerciaisService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  urlFeed(marketplace: 'google' | 'meta'): string {
    const empresaId = this.auth.empresaIdAtual();
    const token = marketplace === 'google' ? this.googleFeedToken : this.metaFeedToken;
    return `${environment.apiUrl}/v1/feed/${marketplace}/${empresaId}?token=${encodeURIComponent(token)}`;
  }

  ngOnInit() {
    this.carregar();
  }

  trocarAba(aba: Aba) {
    this.abaAtiva.set(aba);
    if (aba === 'venda' && this.listasPreco().length === 0) this.carregarListasPreco();
    if (aba === 'metas' && this.vendedoresMetas().length === 0) this.carregarVendedores();
    if (aba === 'condicoes-comerciais') this.carregarCondicoesComerciais();
  }

  carregar() {
    this.carregando.set(true);
    this.configuracoesService.listar().subscribe({
      next: res => {
        const configs = res.dados ?? [];
        const mapa = new Map(configs.map(c => [c.chave, c.valor] as [string, string | undefined]));

        this.smtpHost = mapa.get('smtp_host') ?? '';
        this.smtpPort = mapa.get('smtp_port') ?? '465';
        this.smtpSsl = (mapa.get('smtp_ssl') ?? 'true') !== 'false';
        this.smtpUsuario = mapa.get('smtp_usuario') ?? '';
        this.smtpRemetente = mapa.get('smtp_remetente') ?? '';
        this.smtpNomeRemetente = mapa.get('smtp_nome_remetente') ?? '';
        this.senhaJaConfigurada = !!mapa.get('smtp_senha');
        this.smtpSenha = '';

        this.googleMerchantId = mapa.get('google_merchant_id') ?? '';
        this.googleFeedModo = (mapa.get('google_feed_modo') as 'url' | 'api') ?? 'url';
        this.googleServiceAccountJson = mapa.get('google_service_account_json') ?? '';
        this.googleFeedToken = mapa.get('google_feed_token') ?? '';
        this.metaCatalogId = mapa.get('meta_catalog_id') ?? '';
        this.metaFeedModo = (mapa.get('meta_feed_modo') as 'url' | 'api') ?? 'url';
        this.metaTokenSistema = mapa.get('meta_token_sistema') ?? '';
        this.metaFeedToken = mapa.get('meta_feed_token') ?? '';
        this.siteBaseUrl = mapa.get('site_base_url') ?? '';

        this.googleCustomSearchChaveConfigurada = !!mapa.get('google_custom_search_api_key');
        this.googleCustomSearchApiKey = '';
        this.googleCustomSearchEngineId = mapa.get('google_custom_search_engine_id') ?? '';
        this.googleCustomSearchLimiteDiario = mapa.get('google_custom_search_limite_diario') ?? '100';

        this.processarMetas(configs);

        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as configurações.');
        this.carregando.set(false);
      }
    });
  }

  private parseRegraJson(valor?: string): RegraMeta {
    if (!valor) return { modo: 'valor', valor: 0, percentual: 20 };
    try {
      const obj = JSON.parse(valor);
      if (obj?.modo === 'percentual') return { modo: 'percentual', valor: 0, percentual: Number(obj.percentual) || 0 };
      return { modo: 'valor', valor: Number(obj.valor) || 0, percentual: 20 };
    } catch {
      return { modo: 'valor', valor: 0, percentual: 20 };
    }
  }

  private parseMetasVendedores(valor?: string): Record<string, number> {
    if (!valor) return {};
    try {
      const obj = JSON.parse(valor);
      return obj && typeof obj === 'object' ? obj : {};
    } catch {
      return {};
    }
  }

  private processarMetas(configs: Configuracao[]) {
    const mapa = new Map(configs.map(c => [c.chave, c.valor] as [string, string | undefined]));

    const regra = this.parseRegraJson(mapa.get('dashboard.meta_regra_padrao'));
    this.metaRegraModo = regra.modo;
    this.metaRegraValor = regra.valor;
    this.metaRegraPercentual = regra.percentual;

    this.metaFallbackValor = mapa.get('dashboard.meta_fallback_valor') ?? '';

    const prefixoMes = 'dashboard.meta_mes.';
    const overrides = configs
      .filter(c => c.chave.startsWith(prefixoMes) && c.valor)
      .map(c => ({ chave: c.chave, mes: c.chave.substring(prefixoMes.length), ...this.parseRegraJson(c.valor) }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
    this.metaOverrides.set(overrides);

    this.metasVendedoresMapa = this.parseMetasVendedores(mapa.get('dashboard.metas_vendedores'));
    this.aplicarMetasVendedores();
  }

  private aplicarMetasVendedores() {
    if (this.vendedoresMetas().length === 0) return;
    this.vendedoresMetas.update(lista => lista.map(v => ({ ...v, meta: this.metasVendedoresMapa[String(v.id)] ?? 0 })));
  }

  carregarVendedores() {
    this.carregandoVendedores.set(true);
    this.vendedoresService.listar().subscribe({
      next: res => {
        const lista = res.dados ?? [];
        this.vendedoresMetas.set(lista.map(v => ({ id: v.id, nome: v.nome, vendaRecente: v.vendaRecente, meta: this.metasVendedoresMapa[String(v.id)] ?? 0 })));
        this.carregandoVendedores.set(false);
      },
      error: err => {
        this.carregandoVendedores.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar os vendedores.');
      }
    });
  }

  formatarMesOverride(mes: string): string {
    const [ano, m] = mes.split('-');
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const indice = Number(m) - 1;
    return `${nomes[indice] ?? m}/${ano}`;
  }

  salvarMetaRegra() {
    this.salvandoMetaRegra.set(true);
    const valorJson = this.metaRegraModo === 'percentual'
      ? JSON.stringify({ modo: 'percentual', percentual: this.metaRegraPercentual })
      : JSON.stringify({ modo: 'valor', valor: this.metaRegraValor });

    this.configuracoesService.atualizar('dashboard.meta_regra_padrao', valorJson).subscribe({
      next: () => {
        this.salvandoMetaRegra.set(false);
        this.toast.sucesso('Regra padrão de meta salva.');
        this.carregar();
      },
      error: err => {
        this.salvandoMetaRegra.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar a regra de meta.');
      }
    });
  }

  salvarMetaFallback() {
    if (!this.metaFallbackValor.trim()) {
      this.toast.erro('Informe o valor da meta alternativa.');
      return;
    }

    this.salvandoMetaFallback.set(true);
    this.configuracoesService.atualizar('dashboard.meta_fallback_valor', this.metaFallbackValor.trim()).subscribe({
      next: () => {
        this.salvandoMetaFallback.set(false);
        this.toast.sucesso('Meta alternativa salva.');
        this.carregar();
      },
      error: err => {
        this.salvandoMetaFallback.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar a meta alternativa.');
      }
    });
  }

  adicionarOverrideMeta() {
    if (!this.novoOverrideMes) {
      this.toast.erro('Escolha o mês do override.');
      return;
    }

    this.salvandoOverride.set(true);
    const chave = `dashboard.meta_mes.${this.novoOverrideMes}`;
    const valorJson = this.novoOverrideModo === 'percentual'
      ? JSON.stringify({ modo: 'percentual', percentual: this.novoOverridePercentual })
      : JSON.stringify({ modo: 'valor', valor: this.novoOverrideValor });

    this.configuracoesService.atualizar(chave, valorJson).subscribe({
      next: () => {
        this.salvandoOverride.set(false);
        this.toast.sucesso('Override de meta salvo.');
        this.novoOverrideMes = '';
        this.novoOverrideModo = 'valor';
        this.novoOverrideValor = 0;
        this.novoOverridePercentual = 20;
        this.carregar();
      },
      error: err => {
        this.salvandoOverride.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar o override.');
      }
    });
  }

  removerOverrideMeta(chave: string) {
    this.removendoOverrideChave = chave;
    this.configuracoesService.atualizar(chave, null).subscribe({
      next: () => {
        this.removendoOverrideChave = null;
        this.toast.sucesso('Override removido.');
        this.carregar();
      },
      error: err => {
        this.removendoOverrideChave = null;
        this.toast.erroServidor(err, 'Não foi possível remover o override.');
      }
    });
  }

  salvarMetasVendedores() {
    this.salvandoMetasVendedores.set(true);
    const mapa: Record<string, number> = {};
    for (const v of this.vendedoresMetas()) {
      if (v.meta > 0) mapa[String(v.id)] = v.meta;
    }

    this.configuracoesService.atualizar('dashboard.metas_vendedores', JSON.stringify(mapa)).subscribe({
      next: () => {
        this.salvandoMetasVendedores.set(false);
        this.toast.sucesso('Metas por vendedor salvas.');
        this.carregar();
      },
      error: err => {
        this.salvandoMetasVendedores.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar as metas por vendedor.');
      }
    });
  }

  carregarCondicoesComerciais() {
    this.carregandoCondicoesComerciais.set(true);
    this.condicoesComerciaisService.obter().subscribe({
      next: res => {
        const dados = res.dados;
        if (dados) {
          this.condicoesComerciaisCadastradas.set(true);
          this.parcelaMinimaValor = dados.parcelaMinimaValor;
          this.parcelasMaximas = dados.parcelasMaximas;
          this.descontoPixDinheiroPercentual = dados.descontoPixDinheiroPercentual;
          this.descontoEscolaParceiraPercentual = dados.descontoEscolaParceiraPercentual;
        } else {
          this.condicoesComerciaisCadastradas.set(false);
        }
        this.carregandoCondicoesComerciais.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as condições comerciais.');
        this.carregandoCondicoesComerciais.set(false);
      }
    });
  }

  salvarCondicoesComerciais() {
    this.salvandoCondicoesComerciais.set(true);
    this.condicoesComerciaisService.atualizar({
      parcelaMinimaValor: this.parcelaMinimaValor,
      parcelasMaximas: this.parcelasMaximas,
      descontoPixDinheiroPercentual: this.descontoPixDinheiroPercentual,
      descontoEscolaParceiraPercentual: this.descontoEscolaParceiraPercentual
    }).subscribe({
      next: () => {
        this.salvandoCondicoesComerciais.set(false);
        this.condicoesComerciaisCadastradas.set(true);
        this.toast.sucesso('Condições comerciais salvas.');
      },
      error: err => {
        this.salvandoCondicoesComerciais.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar as condições comerciais.');
      }
    });
  }

  salvarIntegracoes() {
    this.salvandoIntegracoes.set(true);

    const chamadas = [
      this.configuracoesService.atualizar('google_merchant_id', this.googleMerchantId.trim()),
      this.configuracoesService.atualizar('google_feed_modo', this.googleFeedModo),
      this.configuracoesService.atualizar('google_feed_token', this.googleFeedToken.trim()),
      this.configuracoesService.atualizar('meta_catalog_id', this.metaCatalogId.trim()),
      this.configuracoesService.atualizar('meta_feed_modo', this.metaFeedModo),
      this.configuracoesService.atualizar('meta_feed_token', this.metaFeedToken.trim()),
      this.configuracoesService.atualizar('site_base_url', this.siteBaseUrl.trim())
    ];
    if (this.googleServiceAccountJson.trim()) {
      chamadas.push(this.configuracoesService.atualizar('google_service_account_json', this.googleServiceAccountJson.trim()));
    }
    if (this.metaTokenSistema.trim()) {
      chamadas.push(this.configuracoesService.atualizar('meta_token_sistema', this.metaTokenSistema.trim()));
    }

    forkJoin(chamadas).subscribe({
      next: () => {
        this.salvandoIntegracoes.set(false);
        this.toast.sucesso('Integrações salvas.');
        this.carregar();
      },
      error: err => {
        this.salvandoIntegracoes.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar as integrações.');
      }
    });
  }

  salvarBuscaImagens() {
    if (!this.googleCustomSearchEngineId.trim()) {
      this.toast.erro('Informe o ID do mecanismo de pesquisa (cx).');
      return;
    }

    this.salvandoBuscaImagens.set(true);

    const chamadas = [
      this.configuracoesService.atualizar('google_custom_search_engine_id', this.googleCustomSearchEngineId.trim()),
      this.configuracoesService.atualizar('google_custom_search_limite_diario', this.googleCustomSearchLimiteDiario.trim() || '100')
    ];
    if (this.googleCustomSearchApiKey.trim()) {
      chamadas.push(this.configuracoesService.atualizar('google_custom_search_api_key', this.googleCustomSearchApiKey.trim()));
    }

    forkJoin(chamadas).subscribe({
      next: () => {
        this.salvandoBuscaImagens.set(false);
        this.toast.sucesso('Configurações de busca de imagens salvas.');
        this.carregar();
      },
      error: err => {
        this.salvandoBuscaImagens.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar as configurações de busca de imagens.');
      }
    });
  }

  // ---- Venda: listas de preço ----

  carregarListasPreco() {
    this.carregandoListas.set(true);
    this.produtosService.listarListasPreco().subscribe({
      next: res => { this.listasPreco.set(res.dados ?? []); this.carregandoListas.set(false); },
      error: err => { this.carregandoListas.set(false); this.toast.erroServidor(err, 'Não foi possível carregar as listas de preço.'); }
    });
  }

  abrirNovaLista() {
    this.listaEditandoId = null;
    this.formLista = { codigo: '', nome: '', tipo: 'empresa', modoCalculo: 'percentual_venda', percentual: 0, ativo: true };
    this.formListaOperacao = 'soma';
    this.modalListaAberto.set(true);
  }

  abrirEditarLista(lista: ListaPreco) {
    this.listaEditandoId = lista.id;
    this.formLista = {
      codigo: lista.codigo, nome: lista.nome, tipo: lista.tipo,
      modoCalculo: lista.modoCalculo === 'fixo' ? 'percentual_venda' : lista.modoCalculo,
      percentual: lista.percentual ?? 0, ativo: lista.ativo
    };
    this.formListaOperacao = (lista.percentual ?? 0) < 0 ? 'diminui' : 'soma';
    this.modalListaAberto.set(true);
  }

  aoMudarOperacaoLista() {
    this.formListaPercentualAbsoluto = this.formListaPercentualAbsoluto;
  }

  fecharModalLista() {
    this.modalListaAberto.set(false);
  }

  salvarLista() {
    if (!this.formLista.nome.trim()) { this.toast.erro('Informe o nome da lista.'); return; }

    this.salvandoLista.set(true);

    if (this.listaEditandoId) {
      const req: AtualizarListaPrecoRequisicao = {
        nome: this.formLista.nome, tipo: this.formLista.tipo,
        modoCalculo: this.formLista.modoCalculo, percentual: this.formLista.percentual, ativo: this.formLista.ativo
      };
      this.produtosService.atualizarListaPreco(this.listaEditandoId, req).subscribe({
        next: () => { this.salvandoLista.set(false); this.toast.sucesso('Lista atualizada.'); this.modalListaAberto.set(false); this.carregarListasPreco(); },
        error: err => { this.salvandoLista.set(false); this.toast.erroServidor(err, 'Não foi possível atualizar a lista.'); }
      });
    } else {
      const req: CriarListaPrecoRequisicao = {
        nome: this.formLista.nome, tipo: this.formLista.tipo,
        modoCalculo: this.formLista.modoCalculo, percentual: this.formLista.percentual
      };
      this.produtosService.criarListaPreco(req).subscribe({
        next: () => { this.salvandoLista.set(false); this.toast.sucesso('Lista criada.'); this.modalListaAberto.set(false); this.carregarListasPreco(); },
        error: err => { this.salvandoLista.set(false); this.toast.erroServidor(err, 'Não foi possível criar a lista.'); }
      });
    }
  }

  salvarEmail() {
    if (!this.smtpHost.trim() || !this.smtpUsuario.trim()) {
      this.toast.erro('Servidor SMTP e usuário são obrigatórios.');
      return;
    }

    this.salvando.set(true);

    const chamadas = [
      this.configuracoesService.atualizar('smtp_host', this.smtpHost.trim()),
      this.configuracoesService.atualizar('smtp_port', this.smtpPort.trim() || '465'),
      this.configuracoesService.atualizar('smtp_ssl', String(this.smtpSsl)),
      this.configuracoesService.atualizar('smtp_usuario', this.smtpUsuario.trim()),
      this.configuracoesService.atualizar('smtp_remetente', this.smtpRemetente.trim() || this.smtpUsuario.trim()),
      this.configuracoesService.atualizar('smtp_nome_remetente', this.smtpNomeRemetente.trim() || 'Albatroz Papelaria')
    ];

    if (this.smtpSenha.trim()) {
      chamadas.push(this.configuracoesService.atualizar('smtp_senha', this.smtpSenha.trim()));
    }

    forkJoin(chamadas).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Configurações de e-mail salvas.');
        this.carregar();
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar as configurações de e-mail.');
      }
    });
  }
}
