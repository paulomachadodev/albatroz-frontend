import { Produto } from '../models/produto.model';

export interface ProdutoResposta extends Produto {}

export interface ProdutoUploadImagemResposta {
  url: string;
  caminho: string;
}
