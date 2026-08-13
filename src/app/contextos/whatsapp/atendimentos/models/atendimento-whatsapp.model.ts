export type AtendimentoWhatsappStatus = 'Ativo' | 'Aguardando' | 'Com atendente' | 'Encerrado';

export interface AtendimentoWhatsappResumo {
  id: number;
  protocolo: string;
  whatsappId: string;
  idContato?: number;
  nomeContato?: string;
  nomeWhatsapp?: string;
  totalMensagens: number;
  intervencoesHumanas: number;
  inicio: string;
  fim?: string;
  status: AtendimentoWhatsappStatus;
}

export interface AtendimentoWhatsappMensal {
  ano: number;
  mes: number;
  totalAtendimentos: number;
}

export interface AtendimentoWhatsappDiario {
  dia: number;
  totalAtendimentos: number;
}

export type AtendimentoWhatsappRemetente = 'Cliente' | 'Albia' | 'Atendente' | 'Sistema';

export interface AtendimentoWhatsappMensagem {
  quem: AtendimentoWhatsappRemetente;
  mensagem: string | null;
  dataHora: string;
}
