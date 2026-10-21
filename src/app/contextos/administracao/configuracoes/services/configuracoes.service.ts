import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Configuracao, EmpresaCertificado } from '../models/configuracao.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracoesService {
  private endpoint = '/v1/configuracoes';
  private endpointCertificado = '/v1/configuracoes/certificado';

  constructor(private api: ApiService) {}

  listar(): Observable<Resultado<Configuracao[]>> {
    return this.api.get<Configuracao[]>(this.endpoint);
  }

  atualizar(chave: string, valor: string | null): Observable<Resultado<void>> {
    return this.api.put<void>(`${this.endpoint}/${chave}`, { valor });
  }

  obterCertificado(): Observable<Resultado<EmpresaCertificado | null>> {
    return this.api.get<EmpresaCertificado | null>(this.endpointCertificado);
  }

  uploadCertificado(arquivo: File, senha: string, ambienteNfe: string): Observable<Resultado<EmpresaCertificado>> {
    const formulario = new FormData();
    formulario.append('arquivo', arquivo);
    formulario.append('senha', senha);
    formulario.append('ambienteNfe', ambienteNfe);
    return this.api.post<EmpresaCertificado>(this.endpointCertificado, formulario);
  }

  desativarCertificado(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpointCertificado}/${id}`);
  }
}
