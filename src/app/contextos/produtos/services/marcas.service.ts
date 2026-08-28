import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../core/models';
import { ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { OpcaoSelectBusca } from '../../../shared/components/select-busca/select-busca.component';

export interface Marca {
  id: number;
  nome: string;
  descricao?: string;
  ativa: boolean;
  sincronizadaTiny: boolean;
}

export interface MarcaRequisicao {
  nome: string;
  descricao: string | null;
  ativa: boolean;
}

export interface MarcaFiltro {
  texto?: string;
  ordenarPor?: string;
  direcao?: string;
}

@Injectable({ providedIn: 'root' })
export class MarcasService {
  private endpoint = '/v1/marcas';

  constructor(private api: ApiService) {}

  listar(paginacao: ParametrosPaginacao, filtros?: MarcaFiltro): Observable<Resultado<Paginacao<Marca>>> {
    return this.api.getPaginado<Marca>(this.endpoint, paginacao, filtros);
  }

  buscar(termo: string): Observable<OpcaoSelectBusca[]> {
    return this.api.get<OpcaoSelectBusca[]>(`${this.endpoint}/busca`, { termo }).pipe(
      map(res => res.dados ?? [])
    );
  }

  criar(requisicao: MarcaRequisicao): Observable<Resultado<number>> {
    return this.api.post<number>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: MarcaRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}`, requisicao);
  }
}
