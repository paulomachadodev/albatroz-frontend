import { takeUntil } from 'rxjs';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfiguracoesService } from '../../services/configuracoes.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { environment } from '../../../../../../environments/environment';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CampoHintComponent } from '../../../../../shared/components/campo-hint/campo-hint.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';
@Component({ selector: 'app-configuracao-integracoes', standalone: true, imports: [FormsModule, RouterLink, CampoHintComponent, BreadcrumbComponent, PageHeaderComponent], templateUrl: './integracoes-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class IntegracoesConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
    private readonly configuracoesService = inject(ConfiguracoesService);
    private readonly auth = inject(AuthService);
    private readonly toast = inject(ToastService);
    carregando = signal(true);
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
    urlFeed(marketplace: 'google' | 'meta'): string {
        const empresaId = this.auth.empresaIdAtual();
        const token = marketplace === 'google' ? this.googleFeedToken : this.metaFeedToken;
        return `${environment.apiUrl}/v1/feed/${marketplace}/${empresaId}?token=${encodeURIComponent(token)}`;
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
        forkJoin(chamadas).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoIntegracoes.set(false);
                this.toast.sucesso('Integrações salvas.');
                this.marcarSalvo();
                this.carregar();
            },
            error: err => {
                this.salvandoIntegracoes.set(false);
                this.toast.erroServidor(err, 'Não foi possível salvar as integrações.');
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
                this.googleMerchantId = mapa.get('google_merchant_id') ?? '';
                this.googleFeedModo = (mapa.get('google_feed_modo') as 'url' | 'api') ?? 'url';
                this.googleServiceAccountJson = '';
                this.googleFeedToken = mapa.get('google_feed_token') ?? '';
                this.metaCatalogId = mapa.get('meta_catalog_id') ?? '';
                this.metaFeedModo = (mapa.get('meta_feed_modo') as 'url' | 'api') ?? 'url';
                this.metaTokenSistema = '';
                this.metaFeedToken = mapa.get('meta_feed_token') ?? '';
                this.siteBaseUrl = mapa.get('site_base_url') ?? '';
                this.carregando.set(false);
            }, error: err => { this.toast.erroServidor(err, 'Não foi possível carregar as configurações.'); this.carregando.set(false); } });
    }
    ngOnInit() { this.carregar(); }
}
