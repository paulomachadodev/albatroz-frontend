import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Configuracao, EmpresaCertificado, EmpresaConfigCnab, EmpresaIntegracao } from '../models/configuracao.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracoesService {
  private endpoint = '/v1/configuracoes';
  private endpointCertificado = '/v1/configuracoes/certificado';
  private endpointIntegracao = '/v1/configuracoes/integracao';
  private endpointCnab = '/v1/configuracoes/cnab';

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

  obterIntegracao(): Observable<Resultado<EmpresaIntegracao | null>> {
    return this.api.get<EmpresaIntegracao | null>(this.endpointIntegracao);
  }

  atualizarIntegracao(body: { regimeTributario: string; icmsRecuperavel: boolean; pisCofinsRecuperavel: boolean }): Observable<Resultado<EmpresaIntegracao>> {
    return this.api.put<EmpresaIntegracao>(this.endpointIntegracao, body);
  }

  listarCnab(): Observable<Resultado<EmpresaConfigCnab[]>> {
    return this.api.get<EmpresaConfigCnab[]>(this.endpointCnab);
  }

  criarCnab(body: { banco: string; agencia?: string; conta?: string; convenio?: string; descricao?: string }): Observable<Resultado<EmpresaConfigCnab>> {
    return this.api.post<EmpresaConfigCnab>(this.endpointCnab, body);
  }

  atualizarCnab(id: number, body: { banco: string; agencia?: string; conta?: string; convenio?: string; descricao?: string; ativo: boolean }): Observable<Resultado<EmpresaConfigCnab>> {
    return this.api.put<EmpresaConfigCnab>(`${this.endpointCnab}/${id}`, body);
  }

  removerCnab(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.endpointCnab}/${id}`);
  }
}
