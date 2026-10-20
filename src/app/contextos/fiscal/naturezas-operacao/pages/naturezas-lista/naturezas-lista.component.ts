import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NaturezasOperacaoService } from '../../services/naturezas-operacao.service';
import { NaturezaOperacaoResumo } from '../../models/natureza-operacao.model';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';

type AbaTipo = 1 | 2;

@Component({
  selector: 'app-naturezas-lista',
  standalone: true,
  imports: [PageHeaderComponent, BreadcrumbComponent],
  templateUrl: './naturezas-lista.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class NaturezasListaComponent implements OnInit {
  carregando = signal(true);
  itens = signal<NaturezaOperacaoResumo[]>([]);
  aba = signal<AbaTipo>(1);

  itensDaAba = computed(() => this.itens().filter(i => i.tipo === this.aba()));

  readonly rotuloRegime: Partial<Record<string, string>> = {
    mei: 'MEI',
    sn: 'Simples Nacional',
    sn_excesso: 'Simples (excesso de sublimite)',
    lucro_presumido: 'Lucro Presumido',
    lucro_real: 'Lucro Real'
  };

  readonly rotuloPadrao: Record<string, string> = {
    venda: 'Padrão de venda',
    nfce: 'Padrão NFC-e',
    compra: 'Padrão de compra'
  };

  constructor(
    private service: NaturezasOperacaoService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: res => {
        this.itens.set(res.dados ?? []);
        this.carregando.set(false);
      },
      error: err => {
        this.carregando.set(false);
        this.toast.erroServidor(err, 'Não foi possível carregar as naturezas de operação.');
      }
    });
  }

  novo() {
    this.router.navigate(['/fiscal/naturezas-operacao/nova']);
  }

  abrir(item: NaturezaOperacaoResumo) {
    this.router.navigate(['/fiscal/naturezas-operacao', item.id]);
  }

  situacaoIcms(item: NaturezaOperacaoResumo): string {
    return item.csosn ?? item.cstIcms ?? '-';
  }
}
