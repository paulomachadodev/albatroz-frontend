export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  sku: string;
  preco: number;
  estoque: number;
  imagens?: string[];
  criadoEm: Date;
  atualizadoEm: Date;
}
