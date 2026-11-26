export const SITUACAO_WAHA = { Parado: 0, Iniciando: 1, AguardandoLeitura: 2, Conectado: 3, Falha: 4 } as const;
export type SituacaoWaha = (typeof SITUACAO_WAHA)[keyof typeof SITUACAO_WAHA];

export const MOTOR_WAHA = { Noweb: 1, Webjs: 2 } as const;
export type MotorWaha = (typeof MOTOR_WAHA)[keyof typeof MOTOR_WAHA];

export interface WahaConexao {
  configurada: boolean;
  urlBase: string | null;
  sessao: string;
  chaveFinal: string | null;
  motor: MotorWaha;
  validadaEm: string | null;
  versao: string | null;
}

export interface WahaConexaoRequisicao {
  urlBase: string;
  sessao: string;
  chaveApi: string | null;
  motor: MotorWaha;
  versaoEsperada: string | null;
}

export interface WahaStatus {
  configurada: boolean;
  situacao: SituacaoWaha;
  numero: string | null;
  nomePerfil: string | null;
  mensagem: string | null;
}

export interface WahaQr {
  imagemBase64: string;
}

export interface WahaCodigo {
  codigo: string;
}

export interface ApresentacaoStatusWaha {
  titulo: string;
  detalhe: string;
  cor: 'verde' | 'amarelo' | 'azul' | 'cinza' | 'vermelho';
  icone: string;
}

export function apresentarStatusWaha(status: WahaStatus | null): ApresentacaoStatusWaha {
  if (!status) return { titulo: 'Verificando o WhatsApp…', detalhe: '', cor: 'cinza', icone: 'sync' };
  if (!status.configurada) return { titulo: 'WhatsApp ainda não configurado', detalhe: 'Cadastre o servidor na aba Avançado para conectar.', cor: 'cinza', icone: 'settings' };
  switch (status.situacao) {
    case SITUACAO_WAHA.Conectado:
      return { titulo: 'WhatsApp conectado', detalhe: [formatarNumeroWaha(status.numero), status.nomePerfil].filter(Boolean).join(' · '), cor: 'verde', icone: 'check_circle' };
    case SITUACAO_WAHA.AguardandoLeitura:
      return { titulo: 'Escaneie o código para conectar', detalhe: 'O WhatsApp está esperando a leitura do código.', cor: 'amarelo', icone: 'qr_code_2' };
    case SITUACAO_WAHA.Iniciando:
      return { titulo: 'Conectando…', detalhe: 'Pode levar até 1 minuto.', cor: 'azul', icone: 'sync' };
    case SITUACAO_WAHA.Parado:
      return { titulo: 'WhatsApp desconectado', detalhe: 'Toque em Conectar para ligar o número.', cor: 'cinza', icone: 'link_off' };
    default:
      return { titulo: 'Não consegui falar com o WhatsApp', detalhe: status.mensagem ?? 'Tente reiniciar a conexão.', cor: 'vermelho', icone: 'error' };
  }
}

export function formatarNumeroWaha(numero: string | null): string {
  if (!numero) return '';
  const digitos = numero.replace(/\D/g, '');
  const local = digitos.startsWith('55') && digitos.length >= 12 ? digitos.slice(2) : digitos;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return numero;
}

export function normalizarTelefoneBloqueio(digitos: string): string {
  const limpos = digitos.replace(/\D/g, '');
  return limpos.length === 10 || limpos.length === 11 ? `55${limpos}` : limpos;
}

export interface WahaRecebimento {
  urlDestino: string | null;
  eventos: string[];
  tentativas: number;
  intervaloSegundos: number;
  politica: string;
  ignorarStatus: boolean;
  ignorarGrupos: boolean;
  ignorarCanais: boolean;
  ignorarBroadcast: boolean;
  outrosDestinos: number;
}

export type WahaRecebimentoRequisicao = Omit<WahaRecebimento, 'outrosDestinos'> & { urlDestino: string };

export const EVENTOS_WAHA = [
  { valor: 'message.any', nome: 'Toda mensagem (recebida e enviada)', ajuda: 'Recomendado: a Albia precisa ver também o que a loja envia.' },
  { valor: 'message', nome: 'Só mensagens recebidas', ajuda: 'Não inclui o que a loja envia.' },
  { valor: 'message.ack', nome: 'Confirmações de entrega e leitura', ajuda: 'Avisa quando a mensagem foi entregue ou lida.' },
  { valor: 'session.status', nome: 'Mudanças na conexão', ajuda: 'Avisa quando o WhatsApp conecta ou cai.' }
] as const;

export const POLITICAS_WAHA = [
  { valor: 'exponential', nome: 'Cada vez mais espaçadas (recomendado)' },
  { valor: 'linear', nome: 'Aumentando um pouco a cada vez' },
  { valor: 'constant', nome: 'Sempre o mesmo intervalo' }
] as const;
