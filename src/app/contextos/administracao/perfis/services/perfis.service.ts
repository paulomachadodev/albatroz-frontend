import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Perfil, Permissao } from '../models/perfil.model';
import { PerfilCriarRequisicao, PerfilAtualizarRequisicao, AtribuirPermissoesRequisicao } from '../dtos/perfil.dto';

@Injectable({ providedIn: 'root' })
export class PerfisService {
  private endpoint = '/v1/perfis';

  constructor(private api: ApiService) {}

  listar(): Observable<Resultado<Perfil[]>> {
    return this.api.get<Perfil[]>(this.endpoint);
  }

  listarPermissoes(): Observable<Resultado<Permissao[]>> {
    return this.api.get<Permissao[]>(`${this.endpoint}/permissoes`);
  }

  criar(requisicao: PerfilCriarRequisicao): Observable<Resultado<Perfil>> {
    return this.api.post<Perfil>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: PerfilAtualizarRequisicao): Observable<Resultado<Perfil>> {
    return this.api.put<Perfil>(`${this.endpoint}/${id}`, requisicao);
  }

  atribuirPermissoes(id: number, requisicao: AtribuirPermissoesRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/permissoes`, requisicao);
  }

  inativar(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
