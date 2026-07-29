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
}

export interface AtendimentoWhatsappMensal {
  ano: number;
  mes: number;
  totalAtendimentos: number;
}
