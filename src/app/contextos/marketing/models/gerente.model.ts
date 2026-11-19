export interface ItemDiagnostico { titulo: string; detalhe: string; evidencia: string; hipotese: boolean; }
export interface ProdutoSugerido { id: number; codigo: string; nome: string; imagemUrl: string | null; }
export interface PostagemSugerida {
  data: string; diaSemana: number; hora: number; linha: string; usaProdutos: boolean; formato: string; ideia: string;
  produtos: ProdutoSugerido[]; manchete: string | null; fonte: string | null; motivo: string;
}
export interface ExperimentoSugerido { hipotese: string; variavel: string; indicador: string; janelaDias: number; decisao: string; }
export interface PlanoSemanal {
  habilitado: boolean; inicio: string; fim: string; diagnostico: ItemDiagnostico[]; postagens: PostagemSugerida[];
  experimento: ExperimentoSugerido | null; avisos: string[]; geradoEm: string;
}
