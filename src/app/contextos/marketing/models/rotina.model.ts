import { PecaConteudo } from './peca.model';

export interface Rotina {
  id: number; versao: string; nome: string; linha: string; usaProdutos: boolean; categoriaId: number | null; quantidadeProdutos: number;
  marcarProdutos: boolean; diasSemana: number; hora: number; minuto: number; antecedenciaHoras: number; ativa: boolean; ativoIds: number[]; proximaPostagem?: string | null; proximoRascunho?: string | null;
}
export interface RotinaRequisicao {
  nome: string; linha: string; usaProdutos: boolean; categoriaId: number | null; quantidadeProdutos: number; marcarProdutos: boolean;
  diasSemana: number; hora: number; minuto: number; antecedenciaHoras: number; ativa: boolean; ativoIds: number[]; versaoEsperada: string | null;
}
export interface RotinasLista { habilitado: boolean; itens: Rotina[]; }

export interface ArteDaAprovacao { id: number; url: string; }
export interface Aprovacao {
  execucaoId: number; versao: string; rotina: string; previstoPara: string; status: number; mensagemErro: string | null;
  pecaId: number | null; conteudo: PecaConteudo | null; artes: ArteDaAprovacao[]; destinos: string[];
}
export interface Aprovacoes { habilitado: boolean; emPreparo: number; itens: Aprovacao[]; }

export const STATUS_APROVACAO = { aguardando: 4, falhou: 7 } as const;
export const DIAS_DA_ROTINA = [
  { bit: 2, rotulo: 'Seg' }, { bit: 4, rotulo: 'Ter' }, { bit: 8, rotulo: 'Qua' }, { bit: 16, rotulo: 'Qui' },
  { bit: 32, rotulo: 'Sex' }, { bit: 64, rotulo: 'Sáb' }, { bit: 1, rotulo: 'Dom' }
];

export function resumoDias(mascara: number): string {
  if (mascara === 127) return 'Todos os dias';
  return DIAS_DA_ROTINA.filter(d => (mascara & d.bit) !== 0).map(d => d.rotulo).join(', ');
}

export function formatarHorario(hora: number, minuto: number): string {
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}
