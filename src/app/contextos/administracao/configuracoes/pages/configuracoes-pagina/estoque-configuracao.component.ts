import { takeUntil } from 'rxjs';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfiguracoesService } from '../../services/configuracoes.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';
@Component({ selector: 'app-configuracao-estoque', standalone: true, imports: [FormsModule, RouterLink, BreadcrumbComponent, PageHeaderComponent], templateUrl: './estoque-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class EstoqueConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
    private readonly configuracoesService = inject(ConfiguracoesService);
    private readonly toast = inject(ToastService);
    carregando = signal(true);
    metaContagemDiaria = 15;
    salvandoMetaContagem = signal(false);
    salvarMetaContagem() {
        this.salvandoMetaContagem.set(true);
        this.configuracoesService.atualizar('estoque.meta_contagem_diaria', String(this.metaContagemDiaria)).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoMetaContagem.set(false);
                this.toast.sucesso('Meta de contagem salva.');
                this.marcarSalvo();
                this.carregar();
            },
            error: err => {
                this.salvandoMetaContagem.set(false);
                this.toast.erroServidor(err, 'Não foi possível salvar a meta de contagem.');
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
                this.metaContagemDiaria = Number(mapa.get('estoque.meta_contagem_diaria') ?? '15') || 15;
                this.carregando.set(false);
            }, error: err => { this.toast.erroServidor(err, 'Não foi possível carregar as configurações.'); this.carregando.set(false); } });
    }
    ngOnInit() { this.carregar(); }
}
