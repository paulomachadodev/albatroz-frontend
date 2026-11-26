export type AbaAgente = 'geral' | 'identidade' | 'loja' | 'vendas' | 'arquivos' | 'encerramento' | 'protecoes';

export const ABAS_AGENTE: readonly { id: AbaAgente; titulo: string }[] = [
  { id: 'geral', titulo: 'Geral' },
  { id: 'identidade', titulo: 'Identidade e tom' },
  { id: 'loja', titulo: 'Loja' },
  { id: 'vendas', titulo: 'Regras de venda' },
  { id: 'arquivos', titulo: 'Listas e arquivos' },
  { id: 'encerramento', titulo: 'Encerramento' },
  { id: 'protecoes', titulo: 'Proteções' }
];

export const GRUPO_IDENTIDADE = 1;
export const GRUPO_VENDAS = 2;
export const SECAO = { instrucoes: 1, loja: 2, arquivos: 3, encerramento: 4, protecoes: 5 } as const;
export type NomeSecao = keyof typeof SECAO;

export interface InstrucaoAgente {
  chave: string;
  grupo: number;
  titulo: string;
  texto: string;
  editavel: boolean;
}

export interface InstrucoesConteudo { blocos: InstrucaoAgente[]; }

export interface DiaFuncionamento { dia: number; abre: string; fecha: string; }

export interface LojaConteudo {
  endereco: string;
  horarioTexto: string;
  pagamento: string;
  entregas: string;
  latitude: number;
  longitude: number;
  tituloMapa: string;
  palavrasMapa: string[];
  dias: DiaFuncionamento[];
}

export interface ArquivosConteudo {
  perguntaCotarOuImprimir: string;
  avisoImpressao: string;
  colegaImprime: string;
  variosArquivos: string;
  cotacaoPronta: string;
  cotacaoAltaTemporada: string;
  cotacaoEmRevisao: string;
  mesesAltaTemporada: number[];
  respostasCotar: string[];
  respostasImprimir: string[];
  listaLiberada: string;
  instrucaoClassificador: string;
}

export interface LinkEncerramento { tipo: number; texto: string; url: string; }

export interface EncerramentoConteudo {
  horasInatividade: number;
  mensagem: string;
  linkACada: number;
  links: LinkEncerramento[];
}

export interface ProtecoesConteudo { limiteMensagens: number; mensagemMuitasMensagens: string; }

export interface SecaoAgente<T> { conteudo: T; versao: string; atualizadoEm: string; }

export interface SecoesAgente {
  instrucoes: SecaoAgente<InstrucoesConteudo> | null;
  loja: SecaoAgente<LojaConteudo> | null;
  arquivos: SecaoAgente<ArquivosConteudo> | null;
  encerramento: SecaoAgente<EncerramentoConteudo> | null;
  protecoes: SecaoAgente<ProtecoesConteudo> | null;
}

export const TIPOS_LINK_ENCERRAMENTO = [
  { valor: 1, rotulo: 'Site' },
  { valor: 2, rotulo: 'Rede social' },
  { valor: 3, rotulo: 'Avaliação (só sem atendimento humano, uma vez)' }
];

export const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0];

export interface DiaEdicao { dia: number; aberto: boolean; abre: string; fecha: string; }

export function secaoDaAba(aba: AbaAgente): NomeSecao | null {
  if (aba === 'geral') return null;
  return aba === 'identidade' || aba === 'vendas' ? 'instrucoes' : aba;
}

export function separarLista(texto: string): string[] {
  return texto.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

export function separarMeses(texto: string): number[] {
  return separarLista(texto).map(Number);
}

export function diasParaEdicao(dias: DiaFuncionamento[]): DiaEdicao[] {
  return ORDEM_DIAS.map(dia => {
    const atual = dias.find(item => item.dia === dia);
    return { dia, aberto: !!atual, abre: atual?.abre ?? '09:00', fecha: atual?.fecha ?? '18:00' };
  });
}

export function diasParaGravar(dias: DiaEdicao[]): DiaFuncionamento[] {
  return dias.filter(item => item.aberto).map(item => ({ dia: item.dia, abre: item.abre, fecha: item.fecha }));
}
