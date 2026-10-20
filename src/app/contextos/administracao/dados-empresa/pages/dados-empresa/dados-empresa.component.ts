import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DadosEmpresaService } from '../../services/dados-empresa.service';
import { DadosEmpresa, SubstitutoTributario } from '../../models/dados-empresa.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-dados-empresa',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './dados-empresa.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class DadosEmpresaComponent implements OnInit {
  readonly ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE',
    'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  readonly regimes = [
    { id: 'mei', rotulo: 'MEI' },
    { id: 'sn', rotulo: 'Simples Nacional' },
    { id: 'sn_excesso', rotulo: 'Simples Nacional com excesso de sublimite' },
    { id: 'lucro_presumido', rotulo: 'Lucro Presumido' },
    { id: 'lucro_real', rotulo: 'Lucro Real' }
  ];

  carregando = signal(true);
  salvando = signal(false);
  enviandoLogo = signal(false);

  empresa: DadosEmpresa | null = null;
  substitutos: SubstitutoTributario[] = [];

  constructor(
    private service: DadosEmpresaService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.service.obter().subscribe({
      next: res => {
        this.aplicar(res.dados!);
        this.carregando.set(false);
      },
      error: err => {
        this.carregando.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar os dados da empresa.');
      }
    });
  }

  cnpjFormatado(): string {
    const cnpj = this.empresa?.cnpj;
    if (!cnpj || cnpj.length !== 14) return cnpj ?? '';
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
  }

  marcadoIsento(): boolean {
    return this.empresa?.ieIsento === 1;
  }

  alternarIsento() {
    if (!this.empresa) return;
    this.empresa.ieIsento = this.empresa.ieIsento === 1 ? 0 : 1;
  }

  adicionarSubstituto() {
    this.substitutos.push({ uf: '', inscricaoEstadual: '' });
  }

  removerSubstituto(indice: number) {
    this.substitutos.splice(indice, 1);
  }

  salvar() {
    if (!this.empresa) return;

    if (!this.empresa.nome?.trim()) {
      this.toast.erro('Informe o nome fantasia da empresa.');
      return;
    }

    const { id, logoUrl, ...dados } = this.empresa;
    this.salvando.set(true);
    this.service.salvar({ ...dados, substitutos: this.substitutos }).subscribe({
      next: res => {
        this.salvando.set(false);
        this.aplicar(res.dados!);
        this.toast.sucesso('Dados da empresa salvos.');
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar os dados da empresa.');
      }
    });
  }

  aoEscolherLogo(evento: Event) {
    const entrada = evento.target as HTMLInputElement;
    const arquivo = entrada.files?.[0];
    if (!arquivo) return;

    if (arquivo.size > 2 * 1024 * 1024) {
      this.toast.erro('O arquivo do logo não deve ultrapassar 2 MB.');
      entrada.value = '';
      return;
    }

    this.enviandoLogo.set(true);
    this.service.enviarLogo(arquivo).subscribe({
      next: res => {
        this.enviandoLogo.set(false);
        if (this.empresa) this.empresa.logoUrl = res.dados!.logoUrl;
        entrada.value = '';
        this.toast.sucesso('Logo atualizado.');
      },
      error: err => {
        this.enviandoLogo.set(false);
        entrada.value = '';
        this.toast.erroServidor(err, 'Não foi possível enviar o logo.');
      }
    });
  }

  private aplicar(dados: DadosEmpresa) {
    this.empresa = dados;
    this.substitutos = (dados.substitutos ?? []).map(s => ({ ...s }));
  }
}
