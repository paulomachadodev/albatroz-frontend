import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { DadosEmpresa } from '../models/dados-empresa.model';

@Injectable({ providedIn: 'root' })
export class DadosEmpresaService {
  private endpoint = '/v1/cadastros/empresas/atual';

  constructor(private api: ApiService) {}

  obter(): Observable<Resultado<DadosEmpresa>> {
    return this.api.get<DadosEmpresa>(this.endpoint);
  }

  salvar(dados: Omit<DadosEmpresa, 'id' | 'logoUrl'>): Observable<Resultado<DadosEmpresa>> {
    return this.api.put<DadosEmpresa>(this.endpoint, dados);
  }

  enviarLogo(arquivo: File): Observable<Resultado<DadosEmpresa>> {
    const formulario = new FormData();
    formulario.append('arquivo', arquivo);
    return this.api.post<DadosEmpresa>(`${this.endpoint}/logo`, formulario);
  }
}
