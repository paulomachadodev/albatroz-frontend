import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Publicacao, PublicacoesLista, PublicarRequisicao } from '../models/publicacao.model';

@Injectable({ providedIn: 'root' })
export class PublicacoesService {
  private readonly api = inject(ApiService);

  listar(pecaId: number): Observable<Resultado<PublicacoesLista>> { return this.api.get(this.base(pecaId)); }
  publicar(pecaId: number, requisicao: PublicarRequisicao): Observable<Resultado<Publicacao>> { return this.api.post(this.base(pecaId), requisicao); }

  private base(pecaId: number): string { return `/v1/marketing/pecas/${pecaId}/publicacoes`; }
}
