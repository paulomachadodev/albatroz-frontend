import { takeUntil } from 'rxjs';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ProdutosService } from '../../../../produtos/services/produtos.service';
import { ListaPreco } from '../../../../produtos/models/produto.model';
import { CriarListaPrecoRequisicao, AtualizarListaPrecoRequisicao } from '../../../../produtos/dtos/produto-requisicao.dto';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CampoHintComponent } from '../../../../../shared/components/campo-hint/campo-hint.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';
@Component({ selector: 'app-configuracao-venda', standalone: true, imports: [FormsModule, RouterLink, ModalComponent, CampoHintComponent, BreadcrumbComponent, PageHeaderComponent], templateUrl: './venda-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class VendaConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
    protected override permissaoEdicao = 'produtos:editar';
    private readonly produtosService = inject(ProdutosService);
    private readonly toast = inject(ToastService);
    carregando = signal(true);
    listasPreco = signal<ListaPreco[]>([]);
    carregandoListas = signal(false);
    modalListaAberto = signal(false);
    listaEditandoId: number | null = null;
    formLista: {
        codigo: string;
        nome: string;
        tipo: string;
        modoCalculo: 'percentual_venda' | 'percentual_custo';
        percentual: number;
        ativo: boolean;
    } = {
        codigo: '', nome: '', tipo: 'empresa', modoCalculo: 'percentual_venda', percentual: 0, ativo: true
    };
    salvandoLista = signal(false);
    formListaOperacao: 'soma' | 'diminui' = 'soma';
    get formListaPercentualAbsoluto(): number {
        return Math.abs(this.formLista.percentual);
    }
    set formListaPercentualAbsoluto(valor: number) {
        const absoluto = Math.abs(valor || 0);
        this.formLista.percentual = this.formListaOperacao === 'diminui' ? -absoluto : absoluto;
    }
    carregarListasPreco() {
        this.carregandoListas.set(true);
        this.produtosService.listarListasPreco().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
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
        if (!this.formLista.nome.trim()) {
            this.toast.erro('Informe o nome da lista.');
            return;
        }
        this.salvandoLista.set(true);
        if (this.listaEditandoId) {
            const req: AtualizarListaPrecoRequisicao = {
                nome: this.formLista.nome, tipo: this.formLista.tipo,
                modoCalculo: this.formLista.modoCalculo, percentual: this.formLista.percentual, ativo: this.formLista.ativo
            };
            this.produtosService.atualizarListaPreco(this.listaEditandoId, req).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
                next: () => { this.salvandoLista.set(false); this.toast.sucesso('Lista atualizada.'); this.marcarSalvo(); this.modalListaAberto.set(false); this.carregarListasPreco(); },
                error: err => { this.salvandoLista.set(false); this.toast.erroServidor(err, 'Não foi possível atualizar a lista.'); }
            });
        }
        else {
            const req: CriarListaPrecoRequisicao = {
                nome: this.formLista.nome, tipo: this.formLista.tipo,
                modoCalculo: this.formLista.modoCalculo, percentual: this.formLista.percentual
            };
            this.produtosService.criarListaPreco(req).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
                next: () => { this.salvandoLista.set(false); this.toast.sucesso('Lista criada.'); this.marcarSalvo(); this.modalListaAberto.set(false); this.carregarListasPreco(); },
                error: err => { this.salvandoLista.set(false); this.toast.erroServidor(err, 'Não foi possível criar a lista.'); }
            });
        }
    }
    ngOnInit() { this.carregarListasPreco(); this.carregando.set(false); }
}
