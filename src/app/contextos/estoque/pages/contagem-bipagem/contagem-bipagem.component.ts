import { Component, ElementRef, OnDestroy, ViewChild, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProdutosService } from '../../../produtos/services/produtos.service';
import { ContagemEstoqueService } from '../../services/contagem-estoque.service';
import { ToastService } from '../../../../core/feedback/toast.service';
import { ConfirmService } from '../../../../core/feedback/confirm.service';
import { LeitorCodigoBarrasComponent } from '../../../../shared/components/leitor-codigo-barras/leitor-codigo-barras.component';
import { ScrollLockService } from '../../../../shared/services/scroll-lock.service';

interface ItemBipado {
  codigo: string;
  nome: string;
  quantidadeContada: number;
}

const LIMITE_ITENS_SESSAO = 50;

@Component({
  selector: 'app-contagem-bipagem',
  standalone: true,
  imports: [FormsModule, LeitorCodigoBarrasComponent],
  templateUrl: './contagem-bipagem.component.html',
  host: { class: 'block' }
})
export class ContagemBipagemComponent implements OnDestroy {
  fechar = output<void>();

  readonly limite = LIMITE_ITENS_SESSAO;

  passo = signal<'leitor' | 'quantidade' | 'resumo'>('leitor');
  itens = signal<ItemBipado[]>([]);
  buscando = signal(false);
  finalizando = signal(false);

  produtoAtual: { codigo: string; nome: string; urlImagemPrincipal?: string } | null = null;
  modoAtualizacao: 'novo' | 'somar' | 'substituir' = 'novo';
  quantidadeInput = '';

  @ViewChild('inputQuantidade') inputQuantidadeRef?: ElementRef<HTMLInputElement>;

  constructor(
    private produtosService: ProdutosService,
    private contagemService: ContagemEstoqueService,
    private confirm: ConfirmService,
    private toast: ToastService,
    private router: Router,
    private scrollLock: ScrollLockService
  ) {
    this.scrollLock.travar();
  }

  ngOnDestroy() {
    this.scrollLock.destravar();
  }

  aoLerCodigo(codigo: string) {
    if (this.buscando()) return;
    this.buscando.set(true);
    this.produtosService.listar({ pagina: 1, tamanho: 1 }, { texto: codigo, situacao: 'A' }).subscribe({
      next: async res => {
        this.buscando.set(false);
        const produto = (res.dados?.dados ?? [])[0] ?? null;
        if (!produto || produto.tipo !== 'simples') {
          this.toast.erro(`Código "${codigo}" não encontrado.`);
          return;
        }

        const existente = this.itens().find(i => i.codigo === produto.codigo);
        if (existente) {
          const somar = await this.confirm.confirmar(
            'Produto já bipado nessa sessão',
            `${produto.nome} já tem ${existente.quantidadeContada} contado. Somar a nova contagem ao que já foi bipado ou substituir pelo novo valor?`,
            { textoConfirmar: 'Somar', textoCancelar: 'Substituir' }
          );
          this.modoAtualizacao = somar ? 'somar' : 'substituir';
        } else {
          this.modoAtualizacao = 'novo';
        }

        this.produtoAtual = { codigo: produto.codigo, nome: produto.nome, urlImagemPrincipal: produto.urlImagemPrincipal };
        this.quantidadeInput = '';
        this.passo.set('quantidade');
        setTimeout(() => this.inputQuantidadeRef?.nativeElement.focus());
      },
      error: err => {
        this.buscando.set(false);
        this.toast.erroServidor(err, 'Não foi possível buscar o produto.');
      }
    });
  }

  confirmarQuantidade() {
    const valor = Number(this.quantidadeInput.replace(',', '.'));
    if (this.quantidadeInput.trim() === '' || Number.isNaN(valor) || valor < 0) {
      this.toast.erro('Digite uma quantidade válida.');
      return;
    }
    if (!this.produtoAtual) return;

    const codigo = this.produtoAtual.codigo;
    const nome = this.produtoAtual.nome;
    const modo = this.modoAtualizacao;

    this.itens.update(lista => {
      const indice = lista.findIndex(i => i.codigo === codigo);
      if (indice === -1) {
        return [...lista, { codigo, nome, quantidadeContada: valor }];
      }
      const copia = [...lista];
      copia[indice] = {
        ...copia[indice],
        quantidadeContada: modo === 'somar' ? copia[indice].quantidadeContada + valor : valor
      };
      return copia;
    });

    this.produtoAtual = null;

    if (this.itens().length >= this.limite) {
      this.toast.aviso('Limite de itens atingido', `Máximo de ${this.limite} produtos por sessão de bipagem. Finalize essa contagem antes de bipar mais.`);
      this.passo.set('resumo');
    } else {
      this.passo.set('leitor');
    }
  }

  cancelarQuantidade() {
    this.produtoAtual = null;
    this.passo.set('leitor');
  }

  verResumo() {
    this.passo.set('resumo');
  }

  voltarParaLeitor() {
    if (this.itens().length >= this.limite) {
      this.toast.aviso('Limite de itens atingido', `Máximo de ${this.limite} produtos por sessão. Finalize essa contagem antes de bipar mais.`);
      return;
    }
    this.passo.set('leitor');
  }

  removerItem(codigo: string) {
    this.itens.update(lista => lista.filter(i => i.codigo !== codigo));
  }

  fecharTudo() {
    this.fechar.emit();
  }

  finalizar() {
    const itens = this.itens();
    if (itens.length === 0) {
      this.toast.erro('Nenhum item bipado ainda.');
      return;
    }

    this.finalizando.set(true);
    const itensImportacao = itens.map(i => ({
      codigo: i.codigo,
      quantidadeContada: i.quantidadeContada,
      quantidadeSistemaExportacao: null
    }));

    this.contagemService.importarPreview(itensImportacao).subscribe({
      next: res => {
        this.finalizando.set(false);
        this.contagemService.previewPendente = res.dados ?? null;
        this.fechar.emit();
        this.router.navigate(['/estoque/contagem/revisao']);
      },
      error: err => {
        this.finalizando.set(false);
        this.toast.erroServidor(err, 'Não foi possível processar a contagem bipada.');
      }
    });
  }
}
