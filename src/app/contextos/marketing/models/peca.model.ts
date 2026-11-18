export interface PecaConteudo { legenda: string; cta: string; hashtags: string[]; ideiaVisual: string; roteiro: string[]; }
export interface PecaResumo { possuiArteAprovada?: boolean; id: number; versao: string; briefingId: number; rede: string; formato: string; status: number; versaoAtual: number; versaoAprovada: number | null; aprovadaEm: string | null; planejadaPara: string | null; atualizadoEm: string; resumo: string; }
export interface VersaoPeca { numero: number; origem: number; usuarioId: number; criadoEm: string; }
export interface Peca {
  id: number; versao: string; briefingId: number; codigoGeracao: string | null; rede: string; formato: string; status: number;
  versaoAtual: number; versaoAprovada: number | null; aprovadaPor: number | null; aprovadaEm: string | null; planejadaPara: string | null;
  criadoEm: string; atualizadoEm: string; conteudo: PecaConteudo; versoes: VersaoPeca[]; alertaValor: boolean;
}
export interface PecasLista { habilitado: boolean; itens: PecaResumo[]; }
export interface ExportacaoPeca { nomeArquivo: string; texto: string; }
export const STATUS_PECA: Record<number, string> = { 1: 'Rascunho', 2: 'Aprovada', 3: 'Arquivada' };
export const ORIGEM_VERSAO_PECA: Record<number, string> = { 1: 'Gerada pela IA', 2: 'Editada por pessoa' };
