import { Component, OnInit, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CartaoNaoEncontrado } from '../dtos/despesa-cartao-salvar.dto';
import { Cartao } from '../models/cartao.model';
import { CartoesService } from '../services/cartoes.service';

interface CartaoFormItem {
  portadorNome: string | null;
  finalCartao: string;
  tipo: 'principal' | 'adicional' | 'pular' | null;
  apelido: string;
  diaVencimento: number | null;
  diaFechamento: number | null;
  limiteTotal: number | null;
  bandeira: string;
  idCartaoPrincipal: number | null;
  cartaoIdResolvido: number | null;
  salvando: boolean;
  salvo: boolean;
  erro: string | null;
}

@Component({
  selector: 'app-cartao-nao-cadastrado-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cartao-nao-cadastrado-modal.component.html',
})
export class CartaoNaoCadastradoModalComponent implements OnInit {
  cartoesNaoEncontrados = input.required<CartaoNaoEncontrado[]>();
  cartoesCadastrados = input.required<Cartao[]>();
  confirmar = output<Map<string, number>>();

  private cartoesService = inject(CartoesService);

  itens = signal<CartaoFormItem[]>([]);

  cartoesPrincipais = computed(() =>
    this.cartoesCadastrados().filter(c => !c.ehAdicional && !c.idCartaoPrincipal)
  );

  todosResolvidos = computed(() =>
    this.itens().length > 0 && this.itens().every(i => i.salvo || i.tipo === 'pular')
  );

  ngOnInit() {
    this.itens.set(
      this.cartoesNaoEncontrados().map(c => ({
        portadorNome: c.portadorNome,
        finalCartao: c.finalCartao,
        tipo: null,
        apelido: c.portadorNome ?? '',
        diaVencimento: null,
        diaFechamento: null,
        limiteTotal: null,
        bandeira: '',
        idCartaoPrincipal: null,
        cartaoIdResolvido: null,
        salvando: false,
        salvo: false,
        erro: null,
      }))
    );
  }

  async salvarItem(item: CartaoFormItem) {
    if (item.tipo === 'pular') {
      item.salvo = true;
      this.itens.update(l => [...l]);
      return;
    }

    if (!item.apelido || !item.diaVencimento || !item.diaFechamento || item.limiteTotal == null) {
      item.erro = 'Preencha todos os campos obrigatórios.';
      this.itens.update(l => [...l]);
      return;
    }

    if (item.tipo === 'adicional' && !item.idCartaoPrincipal) {
      item.erro = 'Selecione o cartão principal.';
      this.itens.update(l => [...l]);
      return;
    }

    item.salvando = true;
    item.erro = null;
    this.itens.update(l => [...l]);

    try {
      const res = await firstValueFrom(
        this.cartoesService.criar({
          ultimos4Digitos: item.finalCartao,
          apelido: item.apelido,
          diaVencimento: item.diaVencimento!,
          diaFechamento: item.diaFechamento!,
          limiteTotal: item.limiteTotal!,
          bandeira: item.bandeira || undefined,
          idCartaoPrincipal: item.tipo === 'adicional' ? item.idCartaoPrincipal : null,
        })
      );
      item.cartaoIdResolvido = res.dados!.id;
      item.salvo = true;
    } catch (e: any) {
      item.erro = e?.error?.mensagem ?? 'Erro ao cadastrar cartão.';
    } finally {
      item.salvando = false;
      this.itens.update(l => [...l]);
    }
  }

  setTipo(item: CartaoFormItem, tipo: 'principal' | 'adicional' | 'pular') {
    item.tipo = tipo;
    this.itens.update(l => [...l]);
  }

  refreshItens() {
    this.itens.update(l => [...l]);
  }

  concluir() {
    const mapa = new Map<string, number>();
    for (const item of this.itens()) {
      if (item.cartaoIdResolvido != null) {
        mapa.set(item.finalCartao, item.cartaoIdResolvido);
      }
    }
    this.confirmar.emit(mapa);
  }
}
