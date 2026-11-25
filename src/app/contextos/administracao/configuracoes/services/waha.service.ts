import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import {
  AlbiaConfig, AlbiaConfigRequisicao, ContatoBloqueado, ContatoBloqueadoRequisicao,
  WahaCodigo, WahaConexao, WahaConexaoRequisicao, WahaQr, WahaStatus
} from '../models/waha.model';

@Injectable({ providedIn: 'root' })
export class WahaService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/waha';

  obterConexao(): Observable<Resultado<WahaConexao>> {
    return this.api.get(`${this.base}/conexao`);
  }

  salvarConexao(requisicao: WahaConexaoRequisicao): Observable<Resultado<WahaConexao>> {
    return this.api.put(`${this.base}/conexao`, requisicao);
  }

  obterStatus(): Observable<Resultado<WahaStatus>> {
    return this.api.get(`${this.base}/status`);
  }

  iniciar(): Observable<Resultado<WahaStatus>> {
    return this.api.post(`${this.base}/conexao/iniciar`, {});
  }

  reiniciar(): Observable<Resultado<WahaStatus>> {
    return this.api.post(`${this.base}/conexao/reiniciar`, {});
  }

  desconectar(): Observable<Resultado<WahaStatus>> {
    return this.api.post(`${this.base}/conexao/desconectar`, {});
  }

  obterQr(): Observable<Resultado<WahaQr>> {
    return this.api.get(`${this.base}/conexao/qr`);
  }

  solicitarCodigo(telefone: string): Observable<Resultado<WahaCodigo>> {
    return this.api.post(`${this.base}/conexao/codigo-telefone`, { telefone });
  }

  obterAlbia(): Observable<Resultado<AlbiaConfig>> {
    return this.api.get(`${this.base}/albia`);
  }

  salvarAlbia(requisicao: AlbiaConfigRequisicao): Observable<Resultado<AlbiaConfig>> {
    return this.api.put(`${this.base}/albia`, requisicao);
  }

  listarBloqueados(): Observable<Resultado<ContatoBloqueado[]>> {
    return this.api.get(`${this.base}/albia/contatos-bloqueados`);
  }

  adicionarBloqueado(requisicao: ContatoBloqueadoRequisicao): Observable<Resultado<ContatoBloqueado>> {
    return this.api.post(`${this.base}/albia/contatos-bloqueados`, requisicao);
  }

  removerBloqueado(id: number): Observable<Resultado<void>> {
    return this.api.delete(`${this.base}/albia/contatos-bloqueados/${id}`);
  }
}
