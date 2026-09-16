import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { ContagemEstoqueService } from '../../services/contagem-estoque.service';
import { ContagemSessaoService } from '../../services/contagem-sessao.service';
import { ContagemSessaoResumo, ModoContagemSessao } from '../../models/contagem-estoque.model';
import { montarGruposCategoriaSelect, PT_SELECT_CATEGORIA } from '../../utils/categoria-select.util';
import { ToastService } from '../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';
import { MarcasService } from '../../../produtos/services/marcas.service';
import { formatarDataHora } from '../../../../shared/utils/formatar-data-hora.util';

@Component({
  selector: 'app-contagem-guiada-inicio',
  standalone: true,
  imports: [FormsModule, SelectModule, PageHeaderComponent, BreadcrumbComponent, SelectBuscaComponent],
  templateUrl: './contagem-guiada-inicio.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContagemGuiadaInicioComponent implements OnInit {
  carregando = signal(true);
  sessoesAbertas = signal<ContagemSessaoResumo[]>([]);

  modoEscolhido = signal<ModoContagemSessao | null>(null);
  categoriaEscolhida = signal<string | null>(null);
  marcaEscolhida = signal<OpcaoSelectBusca | null>(null);
  gruposCategoriaSelect = signal<ReturnType<typeof montarGruposCategoriaSelect>>([]);
  readonly ptSelectCategoria = PT_SELECT_CATEGORIA;

  buscarMarcas = (termo: string) => this.marcasService.buscar(termo);

  iniciando = signal(false);

  constructor(
    private contagemSessaoService: ContagemSessaoService,
    private contagemEstoqueService: ContagemEstoqueService,
    private marcasService: MarcasService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarSessoesAbertas();
    this.contagemEstoqueService.listarCategorias().subscribe({
      next: res => this.gruposCategoriaSelect.set(montarGruposCategoriaSelect(res.dados ?? [])),
      error: () => this.gruposCategoriaSelect.set([])
    });
  }

  carregarSessoesAbertas() {
    this.carregando.set(true);
    this.contagemSessaoService.listar().subscribe({
      next: res => {
        this.sessoesAbertas.set(res.dados ?? []);
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar suas contagens em aberto.');
        this.carregando.set(false);
      }
    });
  }

  continuar(sessao: ContagemSessaoResumo) {
    this.router.navigate(['/estoque/contagem/guiada', sessao.id]);
  }

  escolherModo(modo: ModoContagemSessao) {
    this.modoEscolhido.set(modo);
    this.categoriaEscolhida.set(null);
    this.marcaEscolhida.set(null);
    if (modo === 'prioridade') this.iniciar();
  }

  cancelarEscolha() {
    this.modoEscolhido.set(null);
  }

  podeIniciar(): boolean {
    if (this.modoEscolhido() === 'categoria') return !!this.categoriaEscolhida();
    if (this.modoEscolhido() === 'marca') return !!this.marcaEscolhida();
    return false;
  }

  iniciar() {
    const modo = this.modoEscolhido();
    if (!modo) return;

    this.iniciando.set(true);
    this.contagemSessaoService.iniciar({
      modo,
      categoriaRaiz: modo === 'categoria' ? this.categoriaEscolhida() : null,
      idMarca: modo === 'marca' ? this.marcaEscolhida()?.id ?? null : null
    }).subscribe({
      next: res => {
        this.iniciando.set(false);
        if (res.dados) this.router.navigate(['/estoque/contagem/guiada', res.dados.id]);
      },
      error: err => {
        this.iniciando.set(false);
        this.toast.erroServidor(err, 'Não foi possível iniciar a contagem.');
      }
    });
  }

  formatarDataHora = formatarDataHora;

  rotuloModo(modo: ModoContagemSessao): string {
    return modo === 'prioridade' ? 'Prioridade' : modo === 'categoria' ? 'Categoria' : 'Marca';
  }

  rotuloStatus(status: string): string {
    return status === 'aberta' ? 'Em andamento' : status === 'emRevisao' ? 'Aguardando efetivação' : status;
  }
}
