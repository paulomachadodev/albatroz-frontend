import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Usuario } from '../models/usuario.model';
import { UsuarioCriarRequisicao, UsuarioAtualizarRequisicao, AtribuirPerfisRequisicao } from '../dtos/usuario.dto';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private endpoint = '/v1/usuarios';

  constructor(private api: ApiService) {}

  listar(): Observable<Resultado<Usuario[]>> {
    return this.api.get<Usuario[]>(this.endpoint);
  }

  criar(requisicao: UsuarioCriarRequisicao): Observable<Resultado<Usuario>> {
    return this.api.post<Usuario>(this.endpoint, requisicao);
  }

  atualizar(id: number, requisicao: UsuarioAtualizarRequisicao): Observable<Resultado<Usuario>> {
    return this.api.put<Usuario>(`${this.endpoint}/${id}`, requisicao);
  }

  atribuirPerfis(id: number, requisicao: AtribuirPerfisRequisicao): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${id}/perfis`, requisicao);
  }

  bloquear(id: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${id}/bloquear`, {});
  }

  desbloquear(id: number): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/${id}/desbloquear`, {});
  }
}
