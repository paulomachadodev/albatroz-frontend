import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../core/models/paginacao.model';
import {
  CategoriaArvoreNo,
  FiltroPrioridadeContagem,
  ItemConfirmarContagem,
  ItemImportacaoContagem,
  OrdenacaoPrioridadeContagem,
  PreviewContagem,
  ProdutoPrioridadeContagem
} from '../models/contagem-estoque.model';

@Injectable({ providedIn: 'root' })
export class ContagemEstoqueService {
  private endpoint = '/v1/produtos/contagem';

  previewPendente: PreviewContagem | null = null;

  constructor(private api: ApiService) {}

  listarPrioritarios(
    paginacao: ParametrosPaginacao,
    filtro?: FiltroPrioridadeContagem,
    ordenacao?: OrdenacaoPrioridadeContagem | null
  ): Observable<Resultado<Paginacao<ProdutoPrioridadeContagem>>> {
    const filtros: Record<string, unknown> = { ...filtro };
    if (ordenacao) {
      filtros['ordenarPor'] = ordenacao.campo;
      filtros['direcao'] = ordenacao.direcao;
    }
    return this.api.getPaginado<ProdutoPrioridadeContagem>(`${this.endpoint}/prioritarios`, paginacao, filtros);
  }

  listarCategorias(): Observable<Resultado<CategoriaArvoreNo[]>> {
    return this.api.get<CategoriaArvoreNo[]>(`${this.endpoint}/categorias`);
  }

  importarPreview(itens: ItemImportacaoContagem[]): Observable<Resultado<PreviewContagem>> {
    return this.api.post<PreviewContagem>(`${this.endpoint}/importar-preview`, { itens });
  }

  confirmar(itens: ItemConfirmarContagem[]): Observable<Resultado<{ produtosAtualizados: number }>> {
    return this.api.post<{ produtosAtualizados: number }>(`${this.endpoint}/confirmar`, { itens });
  }
}
