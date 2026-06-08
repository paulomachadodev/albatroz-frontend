import { DespesaCartao, ParcelaProjetada } from '../models/despesa-cartao.model';

export interface DespesaCartaoSalvarRequisicao {
  despesas: DespesaCartao[];
  projecoes: ParcelaProjetada[];
}

export interface CartaoNaoEncontrado {
  portadorNome: string | null;
  finalCartao: string;
}

export interface ExtrairFaturaResposta {
  despesas: DespesaCartao[];
  valorTotal: number;
  dataVencimento: string;
  taxasAnuidades: number;
  cartoesNaoEncontrados: CartaoNaoEncontrado[];
}
