import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { NotaManifestacaoResumo } from '../models/manifestacao-nfe.model';

@Injectable({ providedIn: 'root' })
export class ManifestacaoNfeService {
  private base = '/v1/compras/manifestacao';

  constructor(private api: ApiService) {}

  registrarCiencia(chave: string): Observable<Resultado<string>> {
    return this.api.post<string>(`${this.base}/${chave}/ciencia`, {});
  }

  registrarConfirmacao(chave: string): Observable<Resultado<string>> {
    return this.api.post<string>(`${this.base}/${chave}/confirmacao`, {});
  }

  registrarNaoRealizada(chave: string, justificativa: string): Observable<Resultado<string>> {
    return this.api.post<string>(`${this.base}/${chave}/nao-realizada`, { justificativa });
  }

  listarNotas(): Observable<Resultado<NotaManifestacaoResumo[]>> {
    return this.api.get<NotaManifestacaoResumo[]>(`${this.base}/notas`);
  }
}
