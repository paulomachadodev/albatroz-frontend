import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../../core/models';
import { ParametrosPaginacao } from '../../../../core/models/paginacao.model';
import { OpcaoSelectBusca } from '../../../../shared/components/select-busca/select-busca.component';

export type TipoContato = 'Cliente' | 'Fornecedor' | 'Transportador' | 'Portador' | 'Outro';

export interface Contato {
  id: number;
  nome: string;
  fantasia?: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  ativo: boolean;
  sincronizadoTiny: boolean;
  tipos: TipoContato[];
}

export interface ContatoRequisicao {
  nome: string;
  fantasia: string | null;
  cpfCnpj: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  ativo: boolean;
  tipos: TipoContato[];
}

export interface ContatoFiltro {
  texto?: string;
  tipo?: TipoContato;
  ordenarPor?: string;
  direcao?: string;
}

export interface ContatoEndereco {
  id: number;
  tipo: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  pais: string;
  principal: boolean;
}

export interface ContatoEnderecoRequisicao {
  tipo: number;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;
  pais: string;
  principal: boolean;
}

export interface ContatoRepresentante {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  cargo?: string;
}

export interface ContatoRepresentanteRequisicao {
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cargo?: string | null;
}

export interface ContatoComprasRequisicao {
  prazoEntregaDias?: number | null;
  valorPedidoMinimo?: number | null;
}

export interface ProdutoFornecido {
  idProduto: number;
  codigo: string;
  nome: string;
  codigoNoFornecedor?: string;
  principal: boolean;
}

export interface ContatoDetalhe {
  id: number;
  codigo: string;
  nome: string;
  fantasia?: string;
  tipoPessoa?: number;
  cpfCnpj?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  crt?: string;
  dataNascimento?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  website?: string;
  whatsappId?: string;
  observacoes?: string;
  ativo: boolean;
  sincronizadoTiny: boolean;
  tipos: TipoContato[];
  prazoEntregaDias?: number;
  valorPedidoMinimo?: number;
  enderecos: ContatoEndereco[];
  representantes: ContatoRepresentante[];
  produtosFornecidos: ProdutoFornecido[];
}

@Injectable({ providedIn: 'root' })
export class ContatosService {
  private endpoint = '/v1/contatos';

  constructor(private api: ApiService) {}

  listar(paginacao: ParametrosPaginacao, filtros?: ContatoFiltro): Observable<Resultado<Paginacao<Contato>>> {
    return this.api.getPaginado<Contato>(this.endpoint, paginacao, filtros);
  }

  buscar(termo: string, tipo?: TipoContato): Observable<OpcaoSelectBusca[]> {
    return this.api.get<{ id: number; nome: string }[]>(`${this.endpoint}/busca`, { termo, tipo }).pipe(
      map(res => (res.dados ?? []).map(c => ({ id: c.id, nome: c.nome })))
    );
  }

  obter(id: number): Observable<Resultado<ContatoDetalhe>> {
    return this.api.get<ContatoDetalhe>(`${this.endpoint}/${id}`);
  }

  // 0 até o backfill de erp.conta_pagar.id_contato rodar — ver scripts/Albatroz.ETL/20260827_1400_*.
  obterSaldoAPagar(id: number): Observable<Resultado<number>> {
    return this.api.get<number>(`${this.endpoint}/${id}/saldo-a-pagar`);
  }

  criar(requisicao: ContatoRequisicao): Observable<Resultado<number>> {
    return this.api.post<number>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: ContatoRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}`, requisicao);
  }

  criarEndereco(id: number, requisicao: ContatoEnderecoRequisicao): Observable<Resultado<number>> {
    return this.api.post<number>(`${this.endpoint}/${id}/enderecos`, requisicao);
  }

  atualizarEndereco(id: number, idEndereco: number, requisicao: ContatoEnderecoRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/enderecos/${idEndereco}`, requisicao);
  }

  excluirEndereco(id: number, idEndereco: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}/enderecos/${idEndereco}`);
  }

  criarRepresentante(id: number, requisicao: ContatoRepresentanteRequisicao): Observable<Resultado<number>> {
    return this.api.post<number>(`${this.endpoint}/${id}/representantes`, requisicao);
  }

  atualizarRepresentante(id: number, idRepresentante: number, requisicao: ContatoRepresentanteRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/representantes/${idRepresentante}`, requisicao);
  }

  excluirRepresentante(id: number, idRepresentante: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}/representantes/${idRepresentante}`);
  }

  atualizarCompras(id: number, requisicao: ContatoComprasRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/compras`, requisicao);
  }
}
