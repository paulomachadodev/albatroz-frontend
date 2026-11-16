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
@Component({ selector: 'app-configuracao-tiny-etl', standalone: true, imports: [FormsModule, RouterLink, BreadcrumbComponent, PageHeaderComponent], templateUrl: './tiny-etl-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class TinyEtlConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
    private readonly configuracoesService = inject(ConfiguracoesService);
    private readonly toast = inject(ToastService);
    carregando = signal(true);
    alertaEmailDestino = '';
    salvandoAlertaEmail = signal(false);
    emailAlertaValido(): boolean {
        const email = this.alertaEmailDestino.trim();
        return email === '' || /^[^s@]+@[^s@]+.[^s@]+$/.test(email);
    }
    salvarAlertaEmail() {
        if (!this.emailAlertaValido()) {
            this.toast.erro('Informe um e-mail válido.');
            return;
        }
        this.salvandoAlertaEmail.set(true);
        const email = this.alertaEmailDestino.trim();
        this.configuracoesService.atualizar('alerta_email_destino', email === '' ? null : email).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.salvandoAlertaEmail.set(false);
                this.toast.sucesso(email === '' ? 'Alertas desativados.' : 'E-mail dos alertas salvo.');
                this.marcarSalvo();
                this.carregar();
            },
            error: err => {
                this.salvandoAlertaEmail.set(false);
                this.toast.erroServidor(err, 'Não foi possível salvar o e-mail dos alertas.');
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
                this.alertaEmailDestino = mapa.get('alerta_email_destino') ?? '';
                this.carregando.set(false);
            }, error: err => { this.toast.erroServidor(err, 'Não foi possível carregar as configurações.'); this.carregando.set(false); } });
    }
    ngOnInit() { this.carregar(); }
}
