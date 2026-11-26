import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import {
  WahaCodigo, WahaConexao, WahaConexaoRequisicao, WahaQr, WahaRecebimento, WahaRecebimentoRequisicao, WahaStatus
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

  obterRecebimento(): Observable<Resultado<WahaRecebimento>> {
    return this.api.get(`${this.base}/recebimento`);
  }

  salvarRecebimento(requisicao: WahaRecebimentoRequisicao): Observable<Resultado<WahaRecebimento>> {
    return this.api.put(`${this.base}/recebimento`, requisicao);
  }
}
