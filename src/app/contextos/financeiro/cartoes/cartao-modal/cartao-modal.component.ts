import { Component, OnInit, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartoesService } from '../services/cartoes.service';
import { Cartao } from '../models/cartao.model';
import { CartaoRequisicao } from '../dtos/cartao-requisicao.dto';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-cartao-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SpinnerComponent],
  templateUrl: './cartao-modal.component.html'
})
export class CartaoModalComponent implements OnInit {
  cartao        = input<Cartao | null>(null);
  principais    = input<Cartao[]>([]);
  principalPre  = input<number | null>(null);
  fechar        = output<boolean>();

  salvando    = signal(false);
  erro        = signal<string | null>(null);
  ehAdicional = signal(false);

  form: CartaoRequisicao = {
    ultimos4Digitos: '',
    apelido: '',
    bandeira: '',
    diaVencimento: 10,
    diaFechamento: 3,
    limiteTotal: 0,
    idCartaoPrincipal: null
  };

  constructor(private service: CartoesService) {}

  ngOnInit() {
    const c = this.cartao();
    if (c) {
      this.form = {
        idCartaoPrincipal: c.idCartaoPrincipal ?? null,
        idContatoPortador: c.idContatoPortador,
        ultimos4Digitos:   c.ultimos4Digitos,
        apelido:           c.apelido,
        bandeira:          c.bandeira,
        diaVencimento:     c.diaVencimento,
        diaFechamento:     c.diaFechamento,
        limiteTotal:       c.limiteTotal
      };
      this.ehAdicional.set(c.idCartaoPrincipal != null);
    } else if (this.principalPre() != null) {
      this.form.idCartaoPrincipal = this.principalPre();
      this.ehAdicional.set(true);
    }
  }

  get opcoesPrincipais(): Cartao[] {
    const atualId = this.cartao()?.id;
    return this.principais().filter(p => p.idCartaoPrincipal == null && p.id !== atualId);
  }

  get titulo(): string { return this.cartao() ? 'Editar cartão' : 'Novo cartão'; }
  get modoEdicao(): boolean { return !!this.cartao(); }

  alternarAdicional(valor: boolean) {
    this.ehAdicional.set(valor);
    if (!valor) this.form.idCartaoPrincipal = null;
  }

  salvar() {
    if (!this.form.ultimos4Digitos || !this.form.apelido) {
      this.erro.set('Preencha os campos obrigatórios.');
      return;
    }
    if (this.ehAdicional() && !this.form.idCartaoPrincipal) {
      this.erro.set('Selecione o cartão principal vinculado.');
      return;
    }
    if (!this.ehAdicional()) this.form.idCartaoPrincipal = null;
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
