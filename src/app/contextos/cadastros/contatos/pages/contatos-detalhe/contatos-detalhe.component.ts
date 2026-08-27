import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  ContatosService, ContatoDetalhe, TipoContato, ContatoEndereco, ContatoEnderecoRequisicao,
  ContatoRepresentante, ContatoRepresentanteRequisicao
} from '../../services/contatos.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../../core/feedback/confirm.service';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ToggleComponent } from '../../../../../shared/components/toggle/toggle.component';

type Aba = 'geral' | 'enderecos' | 'compras' | 'representantes' | 'produtos';

const TODOS_TIPOS: TipoContato[] = ['Cliente', 'Fornecedor', 'Transportador', 'Portador', 'Outro'];
const ROTULOS_TIPO_ENDERECO: Record<number, string> = { 1: 'Principal', 2: 'Cobrança', 3: 'Entrega', 4: 'Outro' };

@Component({
  selector: 'app-contatos-detalhe',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, ModalComponent, ToggleComponent],
  templateUrl: './contatos-detalhe.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class ContatosDetalheComponent implements OnInit {
  readonly todosTipos = TODOS_TIPOS;
  readonly rotulosTipoEndereco = ROTULOS_TIPO_ENDERECO;

  idContato!: number;
  carregando = signal(true);
  contato = signal<ContatoDetalhe | null>(null);
  abaAtiva = signal<Aba>('geral');
  salvando = signal(false);

  // Geral (editável)
  nome = '';
  fantasia = '';
  cpfCnpj = '';
  email = '';
  telefone = '';
  celular = '';
  ativo = true;
  tiposSelecionados = new Set<TipoContato>();

  ehFornecedor = signal(false);

  // Compras
  prazoEntregaDias: number | null = null;
  valorPedidoMinimo: number | null = null;
  salvandoCompras = signal(false);

  // Endereços
  modalEnderecoAberto = signal(false);
  enderecoEmEdicao = signal<ContatoEndereco | null>(null);
  formEndereco: ContatoEnderecoRequisicao = this.enderecoVazio();
  salvandoEndereco = signal(false);

  // Representantes
  modalRepresentanteAberto = signal(false);
  representanteEmEdicao = signal<ContatoRepresentante | null>(null);
  formRepresentante: ContatoRepresentanteRequisicao = { nome: '', telefone: null, email: null, cargo: null };
  salvandoRepresentante = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contatosService: ContatosService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.idContato = Number(params.get('id'));
      this.abaAtiva.set('geral');
      this.carregar();
    });
  }

  carregar() {
    this.carregando.set(true);
    this.contatosService.obter(this.idContato).subscribe({
      next: res => {
        const dados = res.dados ?? null;
        this.contato.set(dados);
        if (dados) {
          this.nome = dados.nome;
          this.fantasia = dados.fantasia ?? '';
          this.cpfCnpj = dados.cpfCnpj ?? '';
          this.email = dados.email ?? '';
          this.telefone = dados.telefone ?? '';
          this.celular = dados.celular ?? '';
          this.ativo = dados.ativo;
          this.tiposSelecionados = new Set(dados.tipos);
          this.ehFornecedor.set(dados.tipos.includes('Fornecedor'));
          this.prazoEntregaDias = dados.prazoEntregaDias ?? null;
          this.valorPedidoMinimo = dados.valorPedidoMinimo ?? null;
          if (!this.ehFornecedor() && (this.abaAtiva() === 'compras' || this.abaAtiva() === 'representantes' || this.abaAtiva() === 'produtos')) {
            this.abaAtiva.set('geral');
          }
        }
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar o contato.');
        this.carregando.set(false);
      }
    });
  }

  trocarAba(aba: Aba) {
    this.abaAtiva.set(aba);
  }

  voltar() {
    this.router.navigate(['/cadastros/contatos']);
  }

  rotuloTipoPessoa(tipo?: number): string {
    return tipo === 1 ? 'Física' : tipo === 2 ? 'Jurídica' : '-';
  }

  aoAlternarAtivo(valor: boolean) { this.ativo = valor; }

  aoAlternarTipo(tipo: TipoContato, marcado: boolean) {
    if (marcado) this.tiposSelecionados.add(tipo);
    else this.tiposSelecionados.delete(tipo);
  }

  salvarGeral() {
    const nome = this.nome.trim();
    if (!nome) { this.toast.erro('Nome é obrigatório.'); return; }
    if (this.tiposSelecionados.size === 0) { this.toast.erro('Selecione ao menos um tipo.'); return; }

    this.salvando.set(true);
    this.contatosService.atualizar(this.idContato, {
      nome,
      fantasia: this.fantasia.trim() || null,
      cpfCnpj: this.cpfCnpj.trim() || null,
      email: this.email.trim() || null,
      telefone: this.telefone.trim() || null,
      celular: this.celular.trim() || null,
      ativo: this.ativo,
      tipos: Array.from(this.tiposSelecionados)
    }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Contato atualizado.');
        this.carregar();
      },
      error: err => { this.salvando.set(false); this.toast.erroServidor(err, 'Não foi possível salvar o contato.'); }
    });
  }

  // ---- Compras ----

  salvarCompras() {
    this.salvandoCompras.set(true);
    this.contatosService.atualizarCompras(this.idContato, {
      prazoEntregaDias: this.prazoEntregaDias,
      valorPedidoMinimo: this.valorPedidoMinimo
    }).subscribe({
      next: () => { this.salvandoCompras.set(false); this.toast.sucesso('Configuração de compras salva.'); },
      error: err => { this.salvandoCompras.set(false); this.toast.erroServidor(err, 'Não foi possível salvar.'); }
    });
  }

  // ---- Endereços ----

  private enderecoVazio(): ContatoEnderecoRequisicao {
    return { tipo: 1, logradouro: '', numero: '', complemento: '', bairro: '', municipio: '', uf: '', cep: '', pais: 'Brasil', principal: false };
  }

  abrirNovoEndereco() {
    this.enderecoEmEdicao.set(null);
    this.formEndereco = this.enderecoVazio();
    this.modalEnderecoAberto.set(true);
  }

  abrirEditarEndereco(endereco: ContatoEndereco) {
    this.enderecoEmEdicao.set(endereco);
    this.formEndereco = {
      tipo: endereco.tipo, logradouro: endereco.logradouro ?? '', numero: endereco.numero ?? '',
      complemento: endereco.complemento ?? '', bairro: endereco.bairro ?? '', municipio: endereco.municipio ?? '',
      uf: endereco.uf ?? '', cep: endereco.cep ?? '', pais: endereco.pais, principal: endereco.principal
    };
    this.modalEnderecoAberto.set(true);
  }

  fecharModalEndereco() { this.modalEnderecoAberto.set(false); }

  salvarEndereco() {
    this.salvandoEndereco.set(true);
    const emEdicao = this.enderecoEmEdicao();

    const aoConcluir = (mensagem: string) => {
      this.salvandoEndereco.set(false);
      this.toast.sucesso(mensagem);
      this.fecharModalEndereco();
      this.carregar();
    };
    const aoFalhar = (err: unknown) => {
      this.salvandoEndereco.set(false);
      this.toast.erroServidor(err, 'Não foi possível salvar o endereço.');
    };

    if (emEdicao) {
      this.contatosService.atualizarEndereco(this.idContato, emEdicao.id, this.formEndereco)
        .subscribe({ next: () => aoConcluir('Endereço atualizado.'), error: aoFalhar });
    } else {
      this.contatosService.criarEndereco(this.idContato, this.formEndereco)
        .subscribe({ next: () => aoConcluir('Endereço adicionado.'), error: aoFalhar });
    }
  }

  async excluirEndereco(endereco: ContatoEndereco) {
    const confirmado = await this.confirm.confirmar('Excluir esse endereço?', undefined, { textoConfirmar: 'Excluir' });
    if (!confirmado) return;

    this.contatosService.excluirEndereco(this.idContato, endereco.id).subscribe({
      next: () => { this.toast.sucesso('Endereço excluído.'); this.carregar(); },
      error: err => this.toast.erroServidor(err, 'Não foi possível excluir o endereço.')
    });
  }

  // ---- Representantes ----

  abrirNovoRepresentante() {
    this.representanteEmEdicao.set(null);
    this.formRepresentante = { nome: '', telefone: null, email: null, cargo: null };
    this.modalRepresentanteAberto.set(true);
  }

  abrirEditarRepresentante(representante: ContatoRepresentante) {
    this.representanteEmEdicao.set(representante);
    this.formRepresentante = {
      nome: representante.nome, telefone: representante.telefone ?? null,
      email: representante.email ?? null, cargo: representante.cargo ?? null
    };
    this.modalRepresentanteAberto.set(true);
  }

  fecharModalRepresentante() { this.modalRepresentanteAberto.set(false); }

  salvarRepresentante() {
    if (!this.formRepresentante.nome.trim()) { this.toast.erro('Nome é obrigatório.'); return; }

    this.salvandoRepresentante.set(true);
    const emEdicao = this.representanteEmEdicao();

    const aoConcluir = (mensagem: string) => {
      this.salvandoRepresentante.set(false);
      this.toast.sucesso(mensagem);
      this.fecharModalRepresentante();
      this.carregar();
    };
    const aoFalhar = (err: unknown) => {
      this.salvandoRepresentante.set(false);
      this.toast.erroServidor(err, 'Não foi possível salvar o representante.');
    };

    if (emEdicao) {
      this.contatosService.atualizarRepresentante(this.idContato, emEdicao.id, this.formRepresentante)
        .subscribe({ next: () => aoConcluir('Representante atualizado.'), error: aoFalhar });
    } else {
      this.contatosService.criarRepresentante(this.idContato, this.formRepresentante)
        .subscribe({ next: () => aoConcluir('Representante adicionado.'), error: aoFalhar });
    }
  }

  async excluirRepresentante(representante: ContatoRepresentante) {
    const confirmado = await this.confirm.confirmar(`Excluir ${representante.nome}?`, undefined, { textoConfirmar: 'Excluir' });
    if (!confirmado) return;

    this.contatosService.excluirRepresentante(this.idContato, representante.id).subscribe({
      next: () => { this.toast.sucesso('Representante excluído.'); this.carregar(); },
      error: err => this.toast.erroServidor(err, 'Não foi possível excluir o representante.')
    });
  }

  abrirProduto(idProduto: number) {
    this.router.navigate(['/produtos', idProduto]);
  }

  formatarReais(valor?: number): string {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
