import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../../core/models';
import { Serie } from '../models/serie.model';
import { SerieCriarRequisicao, SerieAtualizarRequisicao } from '../dtos/serie.dto';

export interface SerieFiltro {
  nome?: string;
  escolaId?: number;
  ativo?: boolean;
  ordenarPor?: string;
  direcao?: string;
}

@Injectable({ providedIn: 'root' })
export class SeriesService {
  private endpoint = '/v1/cadastros/series';

  constructor(private api: ApiService) {}

  listar(pagina: number, tamanho: number, filtro?: SerieFiltro): Observable<Resultado<Paginacao<Serie>>> {
    return this.api.getPaginado<Serie>(this.endpoint, { pagina, tamanho }, filtro);
  }

  criar(requisicao: SerieCriarRequisicao): Observable<Resultado<Serie>> {
    return this.api.post<Serie>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: SerieAtualizarRequisicao): Observable<Resultado<Serie>> {
    return this.api.patch<Serie>(`${this.endpoint}/${id}`, requisicao);
  }
}
