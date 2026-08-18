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

  criar(requisicao: ContatoRequisicao): Observable<Resultado<number>> {
    return this.api.post<number>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: ContatoRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}`, requisicao);
  }
}
