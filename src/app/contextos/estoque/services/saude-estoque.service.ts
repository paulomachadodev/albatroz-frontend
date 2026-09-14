import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../core/models/paginacao.model';
import {
  CategoriaSaudeEstoque,
  CorteGiroCritico,
  JanelaRuptura,
  OrdenacaoSaudeEstoque,
  ProdutoSaudeEstoque,
  SaudeEstoqueResumo
} from '../models/saude-estoque.model';

@Injectable({ providedIn: 'root' })
export class SaudeEstoqueService {
  private endpoint = '/v1/produtos';

  constructor(private api: ApiService) {}

  obterResumo(corteGiroCritico: CorteGiroCritico): Observable<Resultado<SaudeEstoqueResumo>> {
    return this.api.get<SaudeEstoqueResumo>(`${this.endpoint}/saude-estoque/resumo`, { corteGiroCritico });
  }

  listar(
    categoria: CategoriaSaudeEstoque,
    paginacao: ParametrosPaginacao,
    opcoes?: {
      corteGiroCritico?: CorteGiroCritico;
      janelaDias?: JanelaRuptura;
      faixaAging?: string;
      ordenacao?: OrdenacaoSaudeEstoque | null;
    }
  ): Observable<Resultado<Paginacao<ProdutoSaudeEstoque>>> {
    const filtros: Record<string, unknown> = {};
    if (categoria === 'criticos') filtros['corteGiroCritico'] = opcoes?.corteGiroCritico;
    if (categoria === 'em-ruptura') filtros['janelaDias'] = opcoes?.janelaDias;
    if (opcoes?.ordenacao) {
      filtros['ordenarPor'] = opcoes.ordenacao.campo;
      filtros['direcao'] = opcoes.ordenacao.direcao;
    }
    const segmento = categoria === 'aging' ? `aging/${encodeURIComponent(opcoes?.faixaAging ?? '')}` : categoria;
    return this.api.getPaginado<ProdutoSaudeEstoque>(`${this.endpoint}/saude-estoque/${segmento}`, paginacao, filtros);
  }
}
