import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { OpcaoSelectBusca } from '../../../shared/components/select-busca/select-busca.component';
import { ProdutosService } from '../../produtos/services/produtos.service';
import { Arte, ArteRequisicao, ArtesLista } from '../models/arte.model';

@Injectable({ providedIn: 'root' })
export class ArtesService {
  private readonly api = inject(ApiService);
  private readonly produtos = inject(ProdutosService);

  listar(pecaId: number): Observable<Resultado<ArtesLista>> { return this.api.get(this.base(pecaId)); }
  gerar(pecaId: number, requisicao: ArteRequisicao): Observable<Resultado<Arte>> { return this.api.post(this.base(pecaId), requisicao); }
  aprovar(pecaId: number, id: number, versaoEsperada: string): Observable<Resultado<Arte>> { return this.api.post(`${this.base(pecaId)}/${id}/aprovacao`, { versaoEsperada }); }
  descartar(pecaId: number, id: number, versaoEsperada: string): Observable<Resultado<Arte>> { return this.api.post(`${this.base(pecaId)}/${id}/descarte`, { versaoEsperada }); }

  buscarProdutosComFoto = (termo: string): Observable<OpcaoSelectBusca[]> => {
    const texto = termo.trim();
    if (texto.length < 2) return of([]);
    return this.produtos.listar({ pagina: 1, tamanho: 15 }, { texto, temImagem: true })
      .pipe(map(res => (res.sucesso && res.dados ? res.dados.dados.map(p => ({ id: p.id, nome: `${p.nome} (${p.codigo})` })) : [])));
  };

  private base(pecaId: number): string { return `/v1/marketing/pecas/${pecaId}/artes`; }
}
