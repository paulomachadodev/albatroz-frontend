import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { Resultado } from '../../../core/models';
import { Paginacao, ParametrosPaginacao } from '../../../core/models/paginacao.model';
import { VendaPagamento } from '../models/venda-pagamento.model';
import { RelatorioVendaProduto, RelatorioVendaProdutosFiltro } from '../models/relatorio-venda-produto.model';
import { CategoriaVenda } from '../../dashboard/dashboard.service';

@Injectable({ providedIn: 'root' })
export class VendasService {
  private endpoint = '/v1/vendas';

  constructor(private api: ApiService) {}

  listarPorFormaPagamento(forma: string | null, paginacao: ParametrosPaginacao): Observable<Resultado<Paginacao<VendaPagamento>>> {
    return this.api.getPaginado<VendaPagamento>(`${this.endpoint}/por-forma-pagamento`, paginacao, { forma });
  }

  listarSubcategorias(categoriaPai: string): Observable<Resultado<CategoriaVenda[]>> {
    return this.api.get<CategoriaVenda[]>(`${this.endpoint}/por-categoria/subcategorias`, { categoriaPai });
  }

  listarRelatorioProdutos(paginacao: ParametrosPaginacao, filtro: RelatorioVendaProdutosFiltro): Observable<Resultado<Paginacao<RelatorioVendaProduto>>> {
    return this.api.getPaginado<RelatorioVendaProduto>(`${this.endpoint}/relatorio-produtos`, paginacao, filtro);
  }

  exportarRelatorioProdutos(filtro: RelatorioVendaProdutosFiltro): Observable<Resultado<RelatorioVendaProduto[]>> {
    return this.api.get<RelatorioVendaProduto[]>(`${this.endpoint}/relatorio-produtos/exportar`, filtro);
  }
}
