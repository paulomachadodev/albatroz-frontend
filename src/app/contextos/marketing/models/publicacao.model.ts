export interface Publicacao {
  id: number; pecaId: number; arteIds: number[]; ativoId: number; tipoAtivo: number; nomeAtivo: string; status: number;
  permalink: string | null; mensagemErro: string | null; criadoEm: string; concluidoEm: string | null; avisos?: string[];
}
export interface PublicacoesLista { habilitado: boolean; itens: Publicacao[]; }
export interface PublicarRequisicao { ativoId: number; arteIds: number[]; marcarProdutos?: boolean; }
export const STATUS_PUBLICACAO: Record<number, string> = { 1: 'Em andamento', 2: 'Publicada', 3: 'Falhou', 4: 'Incerta: confira o perfil antes de repetir' };
