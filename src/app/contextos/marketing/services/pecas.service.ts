import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { ExportacaoPeca, Peca, PecaConteudo, PecasLista } from '../models/peca.model';

@Injectable({ providedIn: 'root' })
export class PecasService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/v1/marketing/pecas';

  listar(status?: number, briefingId?: number): Observable<Resultado<PecasLista>> {
    const parametros: Record<string, number> = {};
    if (status !== undefined) parametros['status'] = status;
    if (briefingId !== undefined) parametros['briefingId'] = briefingId;
    return this.api.get(this.endpoint, parametros);
  }

  obter(id: number): Observable<Resultado<Peca>> { return this.api.get(`${this.endpoint}/${id}`); }
  criar(codigoGeracao: string): Observable<Resultado<Peca>> { return this.api.post(this.endpoint, { codigoGeracao }); }
  salvarConteudo(id: number, conteudo: PecaConteudo, versaoEsperada: string): Observable<Resultado<Peca>> { return this.api.put(`${this.endpoint}/${id}/conteudo`, { conteudo, versaoEsperada }); }
  aprovar(id: number, versaoEsperada: string, numeroVersao: number): Observable<Resultado<Peca>> { return this.api.post(`${this.endpoint}/${id}/aprovacao`, { versaoEsperada, numeroVersao }); }
  arquivar(id: number, versaoEsperada: string): Observable<Resultado<Peca>> { return this.api.post(`${this.endpoint}/${id}/arquivamento`, { versaoEsperada }); }
  planejar(id: number, planejadaPara: string | null, versaoEsperada: string): Observable<Resultado<Peca>> { return this.api.put(`${this.endpoint}/${id}/planejamento`, { planejadaPara, versaoEsperada }); }
  exportar(id: number): Observable<Resultado<ExportacaoPeca>> { return this.api.get(`${this.endpoint}/${id}/exportacao`); }
}
