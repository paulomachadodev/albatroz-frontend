import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { Resultado } from '../../core/models';
import { CategoriaArvoreNo } from '../models/categoria-arvore.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  constructor(private api: ApiService) {}

  listarArvore(): Observable<Resultado<CategoriaArvoreNo[]>> {
    return this.api.get<CategoriaArvoreNo[]>('/v1/produtos/contagem/categorias');
  }
}
