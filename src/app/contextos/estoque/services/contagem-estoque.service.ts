import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { ItemConfirmarContagem, ItemImportacaoContagem, PreviewContagem, ProdutoPrioridadeContagem } from '../models/contagem-estoque.model';

@Injectable({ providedIn: 'root' })
export class ContagemEstoqueService {
  private endpoint = '/v1/produtos/contagem';

  constructor(private api: ApiService) {}

  listarPrioritarios(paginacao: ParametrosPaginacao): Observable<Resultado<Paginacao<ProdutoPrioridadeContagem>>> {
    return this.api.getPaginado<ProdutoPrioridadeContagem>(`${this.endpoint}/prioritarios`, paginacao);
  }

  importarPreview(itens: ItemImportacaoContagem[]): Observable<Resultado<PreviewContagem>> {
    return this.api.post<PreviewContagem>(`${this.endpoint}/importar-preview`, { itens });
  }

  confirmar(itens: ItemConfirmarContagem[]): Observable<Resultado<{ produtosAtualizados: number }>> {
    return this.api.post<{ produtosAtualizados: number }>(`${this.endpoint}/confirmar`, { itens });
  }
}
