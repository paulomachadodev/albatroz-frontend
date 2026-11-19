export interface Agendamento {
  id: number; versao: string; pecaId: number; ativoId: number; marcarProdutos: boolean; agendadaPara: string;
  status: number; mensagemErro: string | null; executadoEm: string | null; criadoEm: string;
}
export interface AgendamentosLista { habilitado: boolean; itens: Agendamento[]; }
export interface AgendarRequisicao { ativoIds: number[]; agendadaPara: string; marcarProdutos: boolean; }
export const STATUS_AGENDAMENTO: Record<number, string> = { 1: 'Agendado', 2: 'Publicando', 3: 'Publicado', 4: 'Falhou', 5: 'Cancelado' };
