import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { OpcaoSelectBusca } from '../../../shared/components/select-busca/select-busca.component';
import { ProdutosService } from '../../produtos/services/produtos.service';
import { ApiService } from '../../../core/http/api.service';
import { Paginacao, Resultado } from '../../../core/models';
import {
  Briefing, BriefingAtualizacao, BriefingEdicao, BriefingFiltro,
  EstrategiaEditorial, EstrategiaEditorialRequisicao
} from '../models/marketing.model';

@Injectable({ providedIn: 'root' })
export class MarketingService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/v1/marketing';
  private readonly produtos = inject(ProdutosService);

  buscarProdutos = (termo: string): Observable<OpcaoSelectBusca[]> => {
    const texto = termo.trim();
    if (texto.length < 2) return of([]);
    return this.produtos.listar({ pagina: 1, tamanho: 15 }, { texto, temImagem: true })
      .pipe(map(res => (res.sucesso && res.dados ? res.dados.dados.map(p => ({ id: p.id, nome: `${p.nome} (${p.codigo})`, imagem: p.urlImagemPrincipal ?? null })) : [])));
  };

  obterEstrategia(): Observable<Resultado<EstrategiaEditorial>> {
    return this.api.get(`${this.endpoint}/estrategia-editorial`);
  }

  salvarEstrategia(requisicao: EstrategiaEditorialRequisicao): Observable<Resultado<EstrategiaEditorial>> {
    return this.api.put(`${this.endpoint}/estrategia-editorial`, requisicao);
  }

  listarBriefings(pagina: number, tamanho: number, filtro?: BriefingFiltro): Observable<Resultado<Paginacao<Briefing>>> {
    return this.api.getPaginado<Briefing>(`${this.endpoint}/briefings`, { pagina, tamanho }, filtro);
  }

  criarBriefing(requisicao: BriefingEdicao): Observable<Resultado<Briefing>> {
    return this.api.post(`${this.endpoint}/briefings`, requisicao);
  }

  atualizarBriefing(id: number, requisicao: BriefingAtualizacao): Observable<Resultado<Briefing>> {
    return this.api.put(`${this.endpoint}/briefings/${id}`, requisicao);
  }
}
