import { takeUntil } from 'rxjs';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfiguracoesService } from '../../services/configuracoes.service';
import { VendedoresService } from '../../services/vendedores.service';
import { Configuracao } from '../../models/configuracao.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CampoHintComponent } from '../../../../../shared/components/campo-hint/campo-hint.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';
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
@Component({ selector: 'app-configuracao-metas', standalone: true, imports: [FormsModule, RouterLink, CampoHintComponent, BreadcrumbComponent, PageHeaderComponent], templateUrl: './metas-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class MetasConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
    private readonly vendedoresService = inject(VendedoresService);
    private readonly configuracoesService = inject(ConfiguracoesService);
    private readonly toast = inject(ToastService);
    carregando = signal(true);
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
    private parseRegraJson(valor?: string): RegraMeta {
        if (!valor)
            return { modo: 'valor', valor: 0, percentual: 20 };
        try {
            const obj = JSON.parse(valor);
            if (obj?.modo === 'percentual')
                return { modo: 'percentual', valor: 0, percentual: Number(obj.percentual) || 0 };
            return { modo: 'valor', valor: Number(obj.valor) || 0, percentual: 20 };
        }
        catch {
            return { modo: 'valor', valor: 0, percentual: 20 };
        }
    }
    private parseMetasVendedores(valor?: string): Record<string, number> {
        if (!valor)
            return {};
        try {
            const obj = JSON.parse(valor);
            return obj && typeof obj === 'object' ? obj : {};
        }
        catch {
            return {};
        }
    }
    private processarMetas(configs: Configuracao[]) {
        const mapa = new Map(configs.map(c => [c.chave, c.valor] as [
            string,
            string | undefined
        ]));
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
        if (this.vendedoresMetas().length === 0)
            return;
        this.vendedoresMetas.update(lista => lista.map(v => ({ ...v, meta: this.metasVendedoresMapa[String(v.id)] ?? 0 })));
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
        this.configuracoesService.atualizar('dashboard.meta_regra_padrao', valorJson).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoMetaRegra.set(false);
                this.toast.sucesso('Regra padrão de meta salva.');
                this.marcarSalvo();
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
        this.configuracoesService.atualizar('dashboard.meta_fallback_valor', this.metaFallbackValor.trim()).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoMetaFallback.set(false);
                this.toast.sucesso('Meta alternativa salva.');
                this.marcarSalvo();
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
        this.configuracoesService.atualizar(chave, valorJson).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoOverride.set(false);
                this.toast.sucesso('Override de meta salvo.');
                this.marcarSalvo();
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
        this.configuracoesService.atualizar(chave, null).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.removendoOverrideChave = null;
                this.toast.sucesso('Override removido.');
                this.marcarSalvo();
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
            if (v.meta > 0)
                mapa[String(v.id)] = v.meta;
        }
        this.configuracoesService.atualizar('dashboard.metas_vendedores', JSON.stringify(mapa)).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoMetasVendedores.set(false);
                this.toast.sucesso('Metas por vendedor salvas.');
                this.marcarSalvo();
                this.carregar();
            },
            error: err => {
                this.salvandoMetasVendedores.set(false);
                this.toast.erroServidor(err, 'Não foi possível salvar as metas por vendedor.');
            }
        });
    }
    carregar() {
        this.carregando.set(true);
        this.configuracoesService.listar().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({ next: res => {
                const configs = res.dados ?? [];
                const mapa = new Map(configs.map(c => [c.chave, c.valor] as [
                    string,
                    string | undefined
                ]));
                this.processarMetas(configs);
                this.carregando.set(false);
            }, error: err => { this.toast.erroServidor(err, 'Não foi possível carregar as configurações.'); this.carregando.set(false); } });
    }
    ngOnInit() { this.carregar(); this.carregarVendedores(); }
    carregarVendedores() {
        this.carregandoVendedores.set(true);
        this.vendedoresService.listar().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
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
}
