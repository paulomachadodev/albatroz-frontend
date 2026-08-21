import { Component, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CondicoesComerciaisService } from '../../services/condicoes-comerciais.service';
import { ToastService } from '../../../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

type Aba = 'condicoes-comerciais';

@Component({
  selector: 'app-cotacao-configuracoes-pagina',
  standalone: true,
  imports: [RouterLink, FormsModule, PageHeaderComponent],
  templateUrl: './configuracoes-pagina.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class CotacaoConfiguracoesPaginaComponent implements OnInit {
  abaAtiva = signal<Aba>('condicoes-comerciais');

  carregando = signal(true);
  salvando = signal(false);
  cadastrado = signal(false);

  parcelaMinimaValor = 40;
  parcelasMaximas = 6;
  descontoPixDinheiroPercentual = 5;
  descontoEscolaParceiraPercentual = 10;

  constructor(
    private condicoesService: CondicoesComerciaisService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.condicoesService.obter().subscribe({
      next: res => {
        const dados = res.dados;
        if (dados) {
          this.cadastrado.set(true);
          this.parcelaMinimaValor = dados.parcelaMinimaValor;
          this.parcelasMaximas = dados.parcelasMaximas;
          this.descontoPixDinheiroPercentual = dados.descontoPixDinheiroPercentual;
          this.descontoEscolaParceiraPercentual = dados.descontoEscolaParceiraPercentual;
        } else {
          this.cadastrado.set(false);
        }
        this.carregando.set(false);
      },
      error: err => {
        this.toast.erroServidor(err, 'Não foi possível carregar as condições comerciais.');
        this.carregando.set(false);
      }
    });
  }

  salvar() {
    this.salvando.set(true);
    this.condicoesService.atualizar({
      parcelaMinimaValor: this.parcelaMinimaValor,
      parcelasMaximas: this.parcelasMaximas,
      descontoPixDinheiroPercentual: this.descontoPixDinheiroPercentual,
      descontoEscolaParceiraPercentual: this.descontoEscolaParceiraPercentual
    }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.cadastrado.set(true);
        this.toast.sucesso('Condições comerciais salvas.');
      },
      error: err => {
        this.salvando.set(false);
        this.toast.erroServidor(err, 'Não foi possível salvar as condições comerciais.');
      }
    });
  }
}
