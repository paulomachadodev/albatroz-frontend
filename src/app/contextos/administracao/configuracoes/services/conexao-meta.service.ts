import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { AplicativoMeta, AplicativoMetaEdicao, ConcluirConexao, ConexaoMetaEstado, ConexaoSocial, IniciarConexao } from '../models/conexao-meta.model';
@Injectable({ providedIn: 'root' })
export class ConexaoMetaService {
  private readonly api = inject(ApiService);
  private readonly base = '/v1/integracoes-sociais/meta';
  obterAplicativo(): Observable<Resultado<AplicativoMeta>> { return this.api.get(this.base + '/aplicativo'); }
  salvarAplicativo(dados: AplicativoMetaEdicao): Observable<Resultado<AplicativoMeta>> { return this.api.put(this.base + '/aplicativo', dados); }
  obterConexao(): Observable<Resultado<ConexaoMetaEstado>> { return this.api.get(this.base + '/conexao'); }
  iniciar(): Observable<Resultado<IniciarConexao>> { return this.api.post(this.base + '/conexao/iniciar', {}); }
  concluir(dados: ConcluirConexao): Observable<Resultado<ConexaoSocial>> { return this.api.post(this.base + '/conexao/concluir', dados); }
  selecionarAtivos(ativoIds: number[], versaoEsperada: string): Observable<Resultado<ConexaoSocial>> { return this.api.put(this.base + '/conexao/ativos', { ativoIds, versaoEsperada }); }
  desconectar(): Observable<Resultado<void>> { return this.api.delete(this.base + '/conexao'); }
}
