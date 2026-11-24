import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { AplicativoMercadoLivreEdicao, ConcluirConexaoMarketplace, IniciarConexaoMarketplace, MercadoLivreEstado, TesteConexaoMarketplace } from '../models/mercado-livre.model';

@Injectable({ providedIn: 'root' })
export class MercadoLivreService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/integracoes-marketplace/mercado-livre';
  obterEstado(): Observable<Resultado<MercadoLivreEstado>> { return this.api.get(this.base); }
  salvarAplicativo(dados: AplicativoMercadoLivreEdicao): Observable<Resultado<MercadoLivreEstado>> { return this.api.put(this.base + '/aplicativo', dados); }
  testar(): Observable<Resultado<TesteConexaoMarketplace>> { return this.api.post(this.base + '/aplicativo/testar', {}); }
  iniciar(): Observable<Resultado<IniciarConexaoMarketplace>> { return this.api.post(this.base + '/conexao/iniciar', {}); }
  concluir(dados: ConcluirConexaoMarketplace): Observable<Resultado<MercadoLivreEstado>> { return this.api.post(this.base + '/conexao/concluir', dados); }
  desconectar(): Observable<Resultado<void>> { return this.api.delete(this.base + '/conexao'); }
}
