export interface Arte {
  id: number; versao: string; pecaId: number; versaoConteudo: number; produtoId: number | null; formato: number; modelo: number;
  titulo: string; subtitulo: string; url: string; largura: number; altura: number; status: number; ordem: number;
  aprovadaEm: string | null; arquivoDisponivel: boolean; arquivoRemovidoEm: string | null; criadoEm: string;
}
export interface ProdutoDaPeca { id: number; codigo: string; nome: string; }
export interface ArtesLista { habilitado: boolean; versaoConteudoAtual: number; itens: Arte[]; produtos: ProdutoDaPeca[]; }
export const MODELO_ARTE_ENVIADA = 4;
export interface ArteProdutosRequisicao { formato: number; modelo: number; titulo: string; subtitulo: string; }
export interface ArteRequisicao { formato: number; modelo: number; produtoId: number | null; titulo: string; subtitulo: string; fundoBancoImagens?: boolean; consultaFundo?: string; }
export const FORMATOS_ARTE = [
  { valor: 1, rotulo: 'Feed quadrado (1080 × 1080)' },
  { valor: 2, rotulo: 'Feed retrato (1080 × 1350)' },
  { valor: 3, rotulo: 'Story e Reels (1080 × 1920)' }
];
export const MODELOS_ARTE = [
  { valor: 1, rotulo: 'Foto em destaque', usaFoto: true },
  { valor: 2, rotulo: 'Faixa de marca com foto', usaFoto: true },
  { valor: 3, rotulo: 'Texto em destaque', usaFoto: false }
];
export const STATUS_ARTE: Record<number, string> = { 1: 'Rascunho', 2: 'Aprovada', 3: 'Descartada' };
