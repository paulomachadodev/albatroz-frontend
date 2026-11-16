import { takeUntil } from 'rxjs';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfiguracoesService } from '../../services/configuracoes.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CampoHintComponent } from '../../../../../shared/components/campo-hint/campo-hint.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';
@Component({ selector: 'app-configuracao-busca-imagens', standalone: true, imports: [FormsModule, RouterLink, CampoHintComponent, BreadcrumbComponent, PageHeaderComponent], templateUrl: './busca-imagens-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class BuscaImagensConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
    private readonly configuracoesService = inject(ConfiguracoesService);
    private readonly toast = inject(ToastService);
    carregando = signal(true);
    googleCustomSearchApiKey = '';
    googleCustomSearchChaveConfigurada = false;
    googleCustomSearchEngineId = '';
    googleCustomSearchLimiteDiario = '100';
    salvandoBuscaImagens = signal(false);
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
        forkJoin(chamadas).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoBuscaImagens.set(false);
                this.toast.sucesso('Configurações de busca de imagens salvas.');
                this.marcarSalvo();
                this.carregar();
            },
            error: err => {
                this.salvandoBuscaImagens.set(false);
                this.toast.erroServidor(err, 'Não foi possível salvar as configurações de busca de imagens.');
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
                this.googleCustomSearchChaveConfigurada = !!mapa.get('google_custom_search_api_key');
                this.googleCustomSearchApiKey = '';
                this.googleCustomSearchEngineId = mapa.get('google_custom_search_engine_id') ?? '';
                this.googleCustomSearchLimiteDiario = mapa.get('google_custom_search_limite_diario') ?? '100';
                this.carregando.set(false);
            }, error: err => { this.toast.erroServidor(err, 'Não foi possível carregar as configurações.'); this.carregando.set(false); } });
    }
    ngOnInit() { this.carregar(); }
}
