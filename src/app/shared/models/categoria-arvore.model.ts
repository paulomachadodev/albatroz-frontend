export interface CategoriaArvoreNo {
  nome: string;
  idCategoria: number | null;
  categoriaRaiz: string;
  filhos: CategoriaArvoreNo[];
}
