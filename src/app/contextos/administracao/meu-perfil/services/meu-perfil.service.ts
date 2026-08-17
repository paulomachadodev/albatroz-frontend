import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { AlterarSenhaRequisicao } from '../dtos/meu-perfil.dto';

@Injectable({ providedIn: 'root' })
export class MeuPerfilService {
  private endpoint = '/v1/usuarios';

  constructor(private api: ApiService) {}

  alterarSenha(requisicao: AlterarSenhaRequisicao): Observable<Resultado<void>> {
    return this.api.post<void>(`${this.endpoint}/minha-senha`, requisicao);
  }
}
