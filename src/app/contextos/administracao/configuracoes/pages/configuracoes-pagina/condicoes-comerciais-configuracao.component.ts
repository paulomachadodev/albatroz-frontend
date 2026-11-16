import { takeUntil } from 'rxjs';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CondicoesComerciaisService } from '../../../../cotacao/configuracoes/services/condicoes-comerciais.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';
@Component({ selector: 'app-configuracao-condicoes-comerciais', standalone: true, imports: [FormsModule, RouterLink, BreadcrumbComponent, PageHeaderComponent], templateUrl: './condicoes-comerciais-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class CondicoesComerciaisConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
    protected override permissaoEdicao = 'cotacoes:editar';
    private readonly condicoesComerciaisService = inject(CondicoesComerciaisService);
    private readonly toast = inject(ToastService);
    carregando = signal(true);
    carregandoCondicoesComerciais = signal(true);
    salvandoCondicoesComerciais = signal(false);
    condicoesComerciaisCadastradas = signal(false);
    parcelaMinimaValor = 40;
    parcelasMaximas = 6;
    descontoPixDinheiroPercentual = 5;
    descontoEscolaParceiraPercentual = 10;
    validadeDias = 7;
    textoEntrega = '';
    textoRetirada = '';
    textoObservacaoCores = '';
    textoAvisoPrecoEstoque = '';
    whatsappAtendimento = '';
    textoHorarioAtendimento = '';
    reconferirPorPreco = false;
    reconferirPorEstoque = false;
    carregarCondicoesComerciais() {
        this.carregandoCondicoesComerciais.set(true);
        this.condicoesComerciaisService.obter().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: res => {
                const dados = res.dados;
                if (dados) {
                    this.condicoesComerciaisCadastradas.set(true);
                    this.parcelaMinimaValor = dados.parcelaMinimaValor;
                    this.parcelasMaximas = dados.parcelasMaximas;
                    this.descontoPixDinheiroPercentual = dados.descontoPixDinheiroPercentual;
                    this.descontoEscolaParceiraPercentual = dados.descontoEscolaParceiraPercentual;
                    this.validadeDias = dados.validadeDias;
                    this.textoEntrega = dados.textoEntrega ?? '';
                    this.textoRetirada = dados.textoRetirada ?? '';
                    this.textoObservacaoCores = dados.textoObservacaoCores;
                    this.textoAvisoPrecoEstoque = dados.textoAvisoPrecoEstoque;
                    this.whatsappAtendimento = dados.whatsappAtendimento;
                    this.textoHorarioAtendimento = dados.textoHorarioAtendimento;
                    this.reconferirPorPreco = dados.reconferirPorPreco;
                    this.reconferirPorEstoque = dados.reconferirPorEstoque;
                }
                else {
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
            descontoEscolaParceiraPercentual: this.descontoEscolaParceiraPercentual,
            validadeDias: this.validadeDias,
            textoEntrega: this.textoEntrega.trim() || null,
            textoRetirada: this.textoRetirada.trim() || null,
            textoObservacaoCores: this.textoObservacaoCores,
            textoAvisoPrecoEstoque: this.textoAvisoPrecoEstoque,
            whatsappAtendimento: this.whatsappAtendimento,
            textoHorarioAtendimento: this.textoHorarioAtendimento,
            reconferirPorPreco: this.reconferirPorPreco,
            reconferirPorEstoque: this.reconferirPorEstoque
        }).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoCondicoesComerciais.set(false);
                this.condicoesComerciaisCadastradas.set(true);
                this.toast.sucesso('Condições comerciais salvas.');
                this.marcarSalvo();
            },
            error: err => {
                this.salvandoCondicoesComerciais.set(false);
                this.toast.erroServidor(err, 'Não foi possível salvar as condições comerciais.');
            }
        });
    }
    ngOnInit() { this.carregarCondicoesComerciais(); this.carregando.set(false); }
}
