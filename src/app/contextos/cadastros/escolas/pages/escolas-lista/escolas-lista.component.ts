import { Component, OnInit, computed, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { EscolasService } from '../../services/escolas.service';
import { Escola } from '../../models/escola.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ListagemPaginadaComponent } from '../../../../../shared/components/listagem-paginada/listagem-paginada.component';
import { DrawerComponent } from '../../../../../shared/components/drawer/drawer.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ToggleComponent } from '../../../../../shared/components/toggle/toggle.component';
import { Ordenacao, ThOrdenavelComponent } from '../../../../../shared/components/th-ordenavel/th-ordenavel.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';

type ModoDrawer = 'criar' | 'editar';

@Component({
  selector: 'app-escolas-lista',
  standalone: true,
  imports: [FormsModule, ListagemPaginadaComponent, DrawerComponent, PageHeaderComponent, ToggleComponent, ThOrdenavelComponent, BreadcrumbComponent],
  templateUrl: './escolas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class EscolasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<Escola[]>([]);
  totalRegistros = signal(0);
  paginaAtual = signal(1);
  totalPaginas = signal(1);
  tamanhoPagina = signal(10);
  ordenacaoAtual = signal<Ordenacao | null>(null);

  filtroNome = '';

  drawerAberto = signal(false);
  modoDrawer = signal<ModoDrawer>('criar');
  escolaEmEdicao = signal<Escola | null>(null);
  salvando = signal(false);
  enviandoLogo = signal(false);
  arrastandoLogo = signal(false);
  logoAtual = signal<string | null>(null);
  logoPendente = signal<File | null>(null);
  previaLogoPendente = signal<string | null>(null);
  logoExibido = computed(() => this.previaLogoPendente() ?? this.logoAtual());

  private static readonly TIPOS_LOGO = ['image/png', 'image/jpeg', 'image/webp'];
  private static readonly TAMANHO_MAXIMO_LOGO = 2 * 1024 * 1024;

  nome = '';
  bairro = '';
  cidade = '';
  parceira = false;
  ativo = true;

  constructor(
    private escolasService: EscolasService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar(pagina = 1) {
    this.carregando.set(true);
    this.escolasService.listar(
      pagina, this.tamanhoPagina(), this.filtroNome || undefined,
      this.ordenacaoAtual()?.campo, this.ordenacaoAtual()?.direcao
    ).subscribe({
      next: res => {
        this.itens.set(res.dados?.dados ?? []);
        this.totalRegistros.set(res.dados?.totalRegistros ?? 0);
        this.paginaAtual.set(res.dados?.paginaAtual ?? 1);
        this.totalPaginas.set(res.dados?.totalPaginas ?? 1);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as escolas.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.carregar(1);
  }

  limparFiltros() {
    this.filtroNome = '';
    this.ordenacaoAtual.set(null);
    this.carregar(1);
  }

  aoOrdenar(ordenacao: Ordenacao) {
    this.ordenacaoAtual.set(ordenacao);
    this.carregar(1);
  }

  aoMudarPagina(pagina: number) {
    this.carregar(pagina);
  }

  aoMudarTamanhoPagina(tamanho: number) {
    this.tamanhoPagina.set(tamanho);
    this.carregar(1);
  }

  abrirCriar() {
    this.modoDrawer.set('criar');
    this.escolaEmEdicao.set(null);
    this.limparLogoPendente();
    this.logoAtual.set(null);
    this.nome = '';
    this.bairro = '';
    this.cidade = '';
    this.parceira = false;
    this.ativo = true;
    this.drawerAberto.set(true);
  }

  abrirEditar(escola: Escola) {
    this.modoDrawer.set('editar');
    this.escolaEmEdicao.set(escola);
    this.logoAtual.set(escola.logoUrl ?? null);
    this.nome = escola.nome;
    this.bairro = escola.bairro ?? '';
    this.cidade = escola.cidade ?? '';
    this.parceira = escola.parceira;
    this.ativo = escola.ativo;
    this.drawerAberto.set(true);
  }

  fecharDrawer() {
    this.limparLogoPendente();
    this.drawerAberto.set(false);
  }

  cancelar() {
    this.fecharDrawer();
  }

  aoSelecionarLogo(evento: Event) {
    const entrada = evento.target as HTMLInputElement;
    const arquivo = entrada.files?.[0];
    entrada.value = '';
    if (arquivo) this.definirLogo(arquivo);
  }

  aoArrastarSobreLogo(evento: DragEvent) {
    evento.preventDefault();
    this.arrastandoLogo.set(true);
  }

  aoSairDoArrasteLogo() {
    this.arrastandoLogo.set(false);
  }

  aoSoltarLogo(evento: DragEvent) {
    evento.preventDefault();
    this.arrastandoLogo.set(false);
    const arquivo = evento.dataTransfer?.files?.[0];
    if (arquivo) this.definirLogo(arquivo);
  }

  removerLogoPendente() {
    this.limparLogoPendente();
  }

  private definirLogo(arquivo: File) {
    if (!EscolasListaComponent.TIPOS_LOGO.includes(arquivo.type)) {
      this.toast.erro('O logo deve ser PNG, JPEG ou WebP.');
      return;
    }
    if (arquivo.size > EscolasListaComponent.TAMANHO_MAXIMO_LOGO) {
      this.toast.erro('O logo deve ter até 2 MB.');
      return;
    }

    const escola = this.escolaEmEdicao();
    if (this.modoDrawer() === 'editar' && escola) {
      this.enviarLogoDaEscola(escola.id, arquivo);
      return;
    }

    this.limparLogoPendente();
    this.logoPendente.set(arquivo);
    this.previaLogoPendente.set(URL.createObjectURL(arquivo));
  }

  private enviarLogoDaEscola(idEscola: number, arquivo: File) {
    this.enviandoLogo.set(true);
    this.escolasService.enviarLogo(idEscola, arquivo).subscribe({
      next: res => {
        this.enviandoLogo.set(false);
        this.logoAtual.set(res.dados?.logoUrl ?? null);
        this.toast.sucesso('Logo atualizado.');
        this.carregar(this.paginaAtual());
      },
      error: err => {
        this.enviandoLogo.set(false);
        this.toast.erroServidor(err, 'Não foi possível enviar o logo.');
      }
    });
  }

  private limparLogoPendente() {
    const previa = this.previaLogoPendente();
    if (previa) URL.revokeObjectURL(previa);
    this.logoPendente.set(null);
    this.previaLogoPendente.set(null);
  }

  private concluirSalvamento(mensagem: string) {
    this.salvando.set(false);
    this.toast.sucesso(mensagem);
    this.fecharDrawer();
    this.carregar(this.paginaAtual());
  }

  aoAlternarParceira(valor: boolean) {
    this.parceira = valor;
  }

  aoAlternarAtivo(valor: boolean) {
    this.ativo = valor;
  }

  salvar() {
    const nome = this.nome.trim();
    if (!nome) {
      this.toast.erro('Nome da escola é obrigatório.');
      return;
    }

    this.salvando.set(true);
    const payload = {
      nome,
      bairro: this.bairro.trim() || undefined,
      cidade: this.cidade.trim() || undefined,
      parceira: this.parceira,
      ativo: this.ativo
    };

    const request = this.modoDrawer() === 'criar'
      ? this.escolasService.criar(payload)
      : this.escolasService.atualizar(this.escolaEmEdicao()!.id, payload);

    request.subscribe({
      next: res => {
        const logo = this.logoPendente();
        const idCriada = res.dados?.id;
        if (this.modoDrawer() === 'criar' && logo && idCriada) {
          this.escolasService.enviarLogo(idCriada, logo).subscribe({
            next: () => this.concluirSalvamento('Escola criada.'),
            error: () => {
              this.toast.erro('Escola criada, mas o logo não foi enviado. Edite a escola para tentar de novo.');
              this.concluirSalvamento('Escola criada.');
            }
          });
          return;
        }
        this.concluirSalvamento(this.modoDrawer() === 'criar' ? 'Escola criada.' : 'Escola atualizada.');
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar a escola.');
      }
    });
  }
}
