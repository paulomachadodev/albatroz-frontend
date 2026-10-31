export interface NotaManifestacaoResumo {
  id: number;
  chaveAcesso: string | null;
  numeroNota: string | null;
  nomeFornecedor: string | null;
  dataEmissao: string | null;
  valorTotal: number;
  manifestacaoStatus: string | null;
  status: number;
  temXml: boolean;
}
