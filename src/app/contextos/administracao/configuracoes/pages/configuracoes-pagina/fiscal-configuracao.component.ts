import { takeUntil } from 'rxjs';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfiguracoesService } from '../../services/configuracoes.service';
import { EmpresaCertificado, EmpresaConfigCnab, EmpresaIntegracao } from '../../models/configuracao.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfiguracaoFormularioBase } from './configuracao-formulario.base';
@Component({ selector: 'app-configuracao-fiscal', standalone: true, imports: [FormsModule, RouterLink, ModalComponent, BreadcrumbComponent, PageHeaderComponent], templateUrl: './fiscal-configuracao.component.html', host: { class: 'flex-1 flex flex-col min-h-0' } })
export class FiscalConfiguracaoComponent extends ConfiguracaoFormularioBase implements OnInit {
    private readonly configuracoesService = inject(ConfiguracoesService);
    private readonly toast = inject(ToastService);
    carregando = signal(true);
    certificado = signal<EmpresaCertificado | null>(null);
    carregandoCertificado = signal(false);
    arquivoCertificado: File | null = null;
    senhaCertificado = '';
    ambienteNfeCertificado: 'prod' | 'homol' = 'prod';
    uploadandoCertificado = signal(false);
    desativandoCertificado = signal(false);
    integracao = signal<EmpresaIntegracao | null>(null);
    carregandoIntegracao = signal(false);
    integracaoRegime = 'sn';
    integracaoIcms = false;
    integracaoPisCofins = false;
    salvandoIntegracaoFiscal = signal(false);
    listaCnab = signal<EmpresaConfigCnab[]>([]);
    carregandoCnab = signal(false);
    modalCnabAberto = signal(false);
    cnabEditandoId: number | null = null;
    formCnab: {
        banco: string;
        agencia: string;
        conta: string;
        convenio: string;
        descricao: string;
        ativo: boolean;
    } = {
        banco: '', agencia: '', conta: '', convenio: '', descricao: '', ativo: true
    };
    salvandoCnab = signal(false);
    removendoCnabId: number | null = null;
    carregarCertificado() {
        this.carregandoCertificado.set(true);
        this.configuracoesService.obterCertificado().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: res => {
                this.certificado.set(res.dados ?? null);
                this.carregandoCertificado.set(false);
            },
            error: err => {
                this.toast.erroServidor(err, 'Não foi possível carregar o certificado.');
                this.carregandoCertificado.set(false);
            }
        });
    }
    aoSelecionarArquivoCertificado(event: Event) {
        const input = event.target as HTMLInputElement;
        this.arquivoCertificado = input.files?.[0] ?? null;
    }
    uploadCertificado() {
        if (!this.arquivoCertificado) {
            this.toast.erro('Selecione o arquivo .pfx do certificado.');
            return;
        }
        if (!this.senhaCertificado.trim()) {
            this.toast.erro('Informe a senha do certificado.');
            return;
        }
        this.uploadandoCertificado.set(true);
        this.configuracoesService.uploadCertificado(this.arquivoCertificado, this.senhaCertificado, this.ambienteNfeCertificado).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: res => {
                this.uploadandoCertificado.set(false);
                this.certificado.set(res.dados ?? null);
                this.senhaCertificado = '';
                this.arquivoCertificado = null;
                this.toast.sucesso('Certificado A1 salvo com sucesso.');
                this.marcarSalvo();
            },
            error: err => {
                this.uploadandoCertificado.set(false);
                this.toast.erroServidor(err, 'Não foi possível salvar o certificado.');
            }
        });
    }
    desativarCertificado(id: number) {
        this.desativandoCertificado.set(true);
        this.configuracoesService.desativarCertificado(id).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.desativandoCertificado.set(false);
                this.certificado.set(null);
                this.toast.sucesso('Certificado desativado.');
                this.marcarSalvo();
            },
            error: err => {
                this.desativandoCertificado.set(false);
                this.toast.erroServidor(err, 'Não foi possível desativar o certificado.');
            }
        });
    }
    carregarIntegracao() {
        this.carregandoIntegracao.set(true);
        this.configuracoesService.obterIntegracao().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: res => {
                const d = res.dados;
                if (d) {
                    this.integracao.set(d);
                    this.integracaoRegime = d.regimeTributario;
                    this.integracaoIcms = d.icmsRecuperavel;
                    this.integracaoPisCofins = d.pisCofinsRecuperavel;
                }
                this.carregandoIntegracao.set(false);
            },
            error: err => {
                this.toast.erroServidor(err, 'Não foi possível carregar as configurações fiscais.');
                this.carregandoIntegracao.set(false);
            }
        });
    }
    salvarIntegracaoFiscal() {
        this.salvandoIntegracaoFiscal.set(true);
        this.configuracoesService.atualizarIntegracao({
            regimeTributario: this.integracaoRegime,
            icmsRecuperavel: this.integracaoIcms,
            pisCofinsRecuperavel: this.integracaoPisCofins
        }).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: res => {
                this.salvandoIntegracaoFiscal.set(false);
                this.integracao.set(res.dados ?? null);
                this.toast.sucesso('Regime tributário salvo.');
                this.marcarSalvo();
            },
            error: err => {
                this.salvandoIntegracaoFiscal.set(false);
                this.toast.erroServidor(err, 'Não foi possível salvar as configurações fiscais.');
            }
        });
    }
    carregarCnab() {
        this.carregandoCnab.set(true);
        this.configuracoesService.listarCnab().pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: res => { this.listaCnab.set(res.dados ?? []); this.carregandoCnab.set(false); },
            error: err => { this.carregandoCnab.set(false); this.toast.erroServidor(err, 'Não foi possível carregar os bancos CNAB.'); }
        });
    }
    abrirNovoCnab() {
        this.cnabEditandoId = null;
        this.formCnab = { banco: '', agencia: '', conta: '', convenio: '', descricao: '', ativo: true };
        this.modalCnabAberto.set(true);
    }
    abrirEditarCnab(item: EmpresaConfigCnab) {
        this.cnabEditandoId = item.id;
        this.formCnab = {
            banco: item.banco, agencia: item.agencia ?? '', conta: item.conta ?? '',
            convenio: item.convenio ?? '', descricao: item.descricao ?? '', ativo: item.ativo
        };
        this.modalCnabAberto.set(true);
    }
    fecharModalCnab() {
        this.modalCnabAberto.set(false);
    }
    salvarCnab() {
        if (!this.formCnab.banco.trim()) {
            this.toast.erro('Informe o banco.');
            return;
        }
        this.salvandoCnab.set(true);
        const body = {
            banco: this.formCnab.banco.trim(),
            agencia: this.formCnab.agencia.trim() || undefined,
            conta: this.formCnab.conta.trim() || undefined,
            convenio: this.formCnab.convenio.trim() || undefined,
            descricao: this.formCnab.descricao.trim() || undefined
        };
        if (this.cnabEditandoId) {
            this.configuracoesService.atualizarCnab(this.cnabEditandoId, { ...body, ativo: this.formCnab.ativo }).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
                next: () => { this.salvandoCnab.set(false); this.toast.sucesso('Banco CNAB atualizado.'); this.marcarSalvo(); this.modalCnabAberto.set(false); this.carregarCnab(); },
                error: err => { this.salvandoCnab.set(false); this.toast.erroServidor(err, 'Não foi possível atualizar o banco CNAB.'); }
            });
        }
        else {
            this.configuracoesService.criarCnab(body).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
                next: () => { this.salvandoCnab.set(false); this.toast.sucesso('Banco CNAB adicionado.'); this.marcarSalvo(); this.modalCnabAberto.set(false); this.carregarCnab(); },
                error: err => { this.salvandoCnab.set(false); this.toast.erroServidor(err, 'Não foi possível adicionar o banco CNAB.'); }
            });
        }
    }
    removerCnab(id: number) {
        this.removendoCnabId = id;
        this.configuracoesService.removerCnab(id).pipe(takeUntil(this.contextoEncerrado), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => { this.removendoCnabId = null; this.toast.sucesso('Banco CNAB removido.'); this.marcarSalvo(); this.carregarCnab(); },
            error: err => { this.removendoCnabId = null; this.toast.erroServidor(err, 'Não foi possível remover o banco CNAB.'); }
        });
    }
    ngOnInit() { this.carregarCertificado(); this.carregarIntegracao(); this.carregarCnab(); this.carregando.set(false); }
}
