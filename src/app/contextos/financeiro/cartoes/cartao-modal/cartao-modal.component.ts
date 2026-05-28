import { Component, OnInit, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartoesService } from '../services/cartoes.service';
import { Cartao } from '../models/cartao.model';
import { CartaoRequisicao } from '../dtos/cartao-requisicao.dto';

@Component({
  selector: 'app-cartao-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cartao-modal.component.html'
})
export class CartaoModalComponent implements OnInit {
  cartao    = input<Cartao | null>(null);
  fechar    = output<boolean>();

  salvando  = signal(false);
  erro      = signal<string | null>(null);

  form: CartaoRequisicao = {
    ultimos4Digitos: '',
    apelido: '',
    bandeira: '',
    diaVencimento: 10,
    diaFechamento: 3,
    limiteTotal: 0
  };

  constructor(private service: CartoesService) {}

  ngOnInit() {
    const c = this.cartao();
    if (c) {
      this.form = {
        idContatoPortador: c.idContatoPortador,
        ultimos4Digitos:   c.ultimos4Digitos,
        apelido:           c.apelido,
        bandeira:          c.bandeira,
        diaVencimento:     c.diaVencimento,
        diaFechamento:     c.diaFechamento,
        limiteTotal:       c.limiteTotal
      };
    }
  }

  get titulo(): string { return this.cartao() ? 'Editar cartão' : 'Novo cartão'; }
  get modoEdicao(): boolean { return !!this.cartao(); }

  salvar() {
    if (!this.form.ultimos4Digitos || !this.form.apelido) {
      this.erro.set('Preencha os campos obrigatórios.');
      return;
    }
    this.salvando.set(true);
    this.erro.set(null);

    const obs = this.modoEdicao
      ? this.service.atualizar(this.cartao()!.id, this.form)
      : this.service.criar(this.form);

    obs.subscribe({
      next: () => { this.salvando.set(false); this.fechar.emit(true); },
      error: err => {
        this.salvando.set(false);
        this.erro.set(err?.error?.mensagem ?? 'Erro ao salvar cartão.');
      }
    });
  }

  cancelar() { this.fechar.emit(false); }
}
