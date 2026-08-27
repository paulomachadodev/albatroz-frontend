import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../core/models';
import { ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { SugestaoCompra } from '../models/sugestao-compra.model';

export type ComSugestaoFiltro = 'com_sugestao' | 'sem_sugestao';

export interface SugestaoCompraFiltro {
  texto?: string;
  idMarca?: number;
  idFornecedor?: number;
  curvaAbc?: string;
  comSugestao?: ComSugestaoFiltro;
  dataInicio?: string;
  dataFim?: string;
  ordenarPor?: string;
  direcao?: 'asc' | 'desc';
}

export interface EstadoListaSugestoes {
  filtro: SugestaoCompraFiltro;
  pagina: number;
  tamanhoPagina: number;
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private endpoint = '/v1/compras';

  estadoLista?: EstadoListaSugestoes;

  constructor(private api: ApiService) {}

  listarSugestoes(paginacao: ParametrosPaginacao, filtros?: SugestaoCompraFiltro): Observable<Resultado<Paginacao<SugestaoCompra>>> {
    return this.api.getPaginado<SugestaoCompra>(`${this.endpoint}/sugestoes`, paginacao, filtros);
  }
}
