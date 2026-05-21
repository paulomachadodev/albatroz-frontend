export interface Resultado<T> {
  dados?: T;
  sucesso: boolean;
  mensagem?: string;
  erros?: Erro[];
}

export interface Erro {
  codigo: string;
  mensagem: string;
  detalhes?: string;
}
