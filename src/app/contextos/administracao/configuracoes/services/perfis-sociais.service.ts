import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { MarketingFiltros, PerfilSocial, PerfilSocialEdicao, PerfisSociaisLista } from '../models/perfil-social.model';
@Injectable({ providedIn: 'root' })
export class PerfisSociaisService {
  private readonly api = inject(ApiService);
  listar(): Observable<Resultado<PerfisSociaisLista>> { return this.api.get('/v1/integracoes-sociais/perfis'); }
  criar(dados: PerfilSocialEdicao): Observable<Resultado<PerfilSocial>> { return this.api.post('/v1/integracoes-sociais/perfis', dados); }
  atualizar(id: number, dados: PerfilSocialEdicao, versaoEsperada: string): Observable<Resultado<PerfilSocial>> { return this.api.put('/v1/integracoes-sociais/perfis/' + id, { ...dados, versaoEsperada }); }
  filtros(): Observable<Resultado<MarketingFiltros>> { return this.api.get('/v1/marketing/filtros'); }
}
