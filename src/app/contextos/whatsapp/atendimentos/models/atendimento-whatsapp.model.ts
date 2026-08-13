export type AtendimentoWhatsappStatus = 'Ativo' | 'Aguardando' | 'Com atendente' | 'Encerrado';

export interface AtendimentoWhatsappResumo {
  whatsappId: string;
  idContato?: number;
  nomeContato?: string;
  totalMensagens: number;
  totalAtendimentos: number;
  cotacoesLista: number;
  intervencoesHumanas: number;
  primeiraMensagem: string;
  ultimaMensagem: string;
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

export type AtendimentoWhatsappRemetente = 'Cliente' | 'Albia' | 'Atendente Humano';

export interface AtendimentoWhatsappMensagem {
  quem: AtendimentoWhatsappRemetente;
  mensagem: string | null;
  dataHora: string;
}
