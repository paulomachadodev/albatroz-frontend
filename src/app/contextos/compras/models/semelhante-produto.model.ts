export interface SemelhanteProduto {
  idProduto: number;
  codigo: string;
  nome: string;
  marca: string | null;
  preco: number;
  nota: number;
  diferencaPrecoPct: number;
  estoqueAtual: number;
  diasCobertura: number | null;
}
