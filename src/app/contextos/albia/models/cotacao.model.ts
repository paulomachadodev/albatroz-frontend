export interface Cotacao {
  id: number;
  itens: ItemCotacao[];
  status: string;
  dataSolicitacao: Date;
  dataValidade: Date;
}

export interface ItemCotacao {
  id: number;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}
