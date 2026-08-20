import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfiguracoesService } from '../../services/configuracoes.service';
import { Configuracao } from '../../models/configuracao.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ProdutosService } from '../../../../produtos/services/produtos.service';
import { ListaPreco } from '../../../../produtos/models/produto.model';
import { CriarListaPrecoRequisicao, AtualizarListaPrecoRequisicao } from '../../../../produtos/dtos/produto-requisicao.dto';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CampoHintComponent } from '../../../../../shared/components/campo-hint/campo-hint.component';

type Aba = 'email' | 'venda' | 'integracoes';

@Component({
  selector: 'app-configuracoes-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent, ModalComponent, CampoHintComponent],
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
  metaCatalogId = '';
  metaFeedModo: 'url' | 'api' = 'url';
  metaTokenSistema = '';
  salvandoIntegracoes = signal(false);

  // ---- Venda: listas de preço ----
  listasPreco = signal<ListaPreco[]>([]);
  carregandoListas = signal(false);
  modalListaAberto = signal(false);
  listaEditandoId: number | null = null;
  formLista: { codigo: string; nome: string; tipo: string; modoCalculo: 'percentual_venda' | 'percentual_custo'; percentual: number; ativo: boolean } = {
    codigo: '', nome: '', tipo: 'empresa', modoCalculo: 'percentual_venda', percentual: 0, ativo: true
  };
  salvandoLista = signal(false);

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
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  trocarAba(aba: Aba) {
    this.abaAtiva.set(aba);
    if (aba === 'venda' && this.listasPreco().length === 0) this.carregarListasPreco();
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
        this.metaCatalogId = mapa.get('meta_catalog_id') ?? '';
        this.metaFeedModo = (mapa.get('meta_feed_modo') as 'url' | 'api') ?? 'url';
        this.metaTokenSistema = mapa.get('meta_token_sistema') ?? '';

        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as configurações.');
        this.carregando.set(false);
      }
    });
  }

  salvarIntegracoes() {
    this.salvandoIntegracoes.set(true);

    const chamadas = [
      this.configuracoesService.atualizar('google_merchant_id', this.googleMerchantId.trim()),
      this.configuracoesService.atualizar('google_feed_modo', this.googleFeedModo),
      this.configuracoesService.atualizar('meta_catalog_id', this.metaCatalogId.trim()),
      this.configuracoesService.atualizar('meta_feed_modo', this.metaFeedModo)
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
