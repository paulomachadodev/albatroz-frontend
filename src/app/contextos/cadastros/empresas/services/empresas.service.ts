import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado, Paginacao } from '../../../../core/models';
import { Empresa } from '../models/empresa.model';
import { EmpresaCriarRequisicao, EmpresaAtualizarRequisicao } from '../dtos/empresa.dto';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private endpoint = '/v1/cadastros/empresas';

  constructor(private api: ApiService) {}

  listar(pagina: number, tamanho: number, nome?: string): Observable<Resultado<Paginacao<Empresa>>> {
    return this.api.getPaginado<Empresa>(this.endpoint, { pagina, tamanho }, nome ? { nome } : undefined);
  }

  criar(requisicao: EmpresaCriarRequisicao): Observable<Resultado<Empresa>> {
    return this.api.post<Empresa>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: EmpresaAtualizarRequisicao): Observable<Resultado<Empresa>> {
    return this.api.patch<Empresa>(`${this.endpoint}/${id}`, requisicao);
  }
}
