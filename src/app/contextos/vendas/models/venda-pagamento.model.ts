export interface VendaPagamento {
  numero: string;
  cliente: string;
  vendedor: string | null;
  data: string;
  forma: string;
  valor: number;
}
