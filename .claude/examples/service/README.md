# Exemplo — HTTP Service

Exemplo canônico de serviço HTTP no padrão Albatroz.

**Fonte:** `src/app/contextos/financeiro/cartoes/services/cartoes.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { Resultado } from '../../../../core/models';
import { Cartao } from '../models/cartao.model';
import { CategoriaDespesa } from '../models/categoria-despesa.model';
import { CartaoRequisicao } from '../dtos/cartao-requisicao.dto';

@Injectable({ providedIn: 'root' })
export class CartoesService {
  private readonly base = '/v1/financeiro/cartoes';
  private readonly catBase = '/v1/financeiro/categorias-despesa';

  constructor(private api: ApiService) {}

  listar(): Observable<Resultado<Cartao[]>> {
    return this.api.get<Cartao[]>(this.base);
  }

  obter(id: number): Observable<Resultado<Cartao>> {
    return this.api.get<Cartao>(`${this.base}/${id}`);
  }

  criar(req: CartaoRequisicao): Observable<Resultado<Cartao>> {
    return this.api.post<Cartao>(this.base, req);
  }

  atualizar(id: number, req: CartaoRequisicao): Observable<Resultado<Cartao>> {
    return this.api.put<Cartao>(`${this.base}/${id}`, req);
  }

  listarCategorias(): Observable<Resultado<CategoriaDespesa[]>> {
    return this.api.get<CategoriaDespesa[]>(this.catBase);
  }

  criarCategoria(nome: string): Observable<Resultado<CategoriaDespesa>> {
    return this.api.post<CategoriaDespesa>(this.catBase, { nome });
  }

  excluirCategoria(id: number): Observable<Resultado<void>> {
    return this.api.delete<void>(`${this.catBase}/${id}`);
  }
}
```

**Padrões ilustrados:**

- `@Injectable({ providedIn: 'root' })` — sempre root-scoped, sem módulo
- `private readonly base` — URL base como constante privada, nunca inline
- Todos os métodos retornam `Observable<Resultado<T>>` — nunca `Promise`, nunca `any`
- `ApiService` é o único ponto de acesso HTTP (wrapper do `HttpClient`)
- Tipos explícitos em todos os retornos — nunca inferência implícita de `any`
- Constructor injection aqui (legado); preferir `inject()` em código novo (ver `@standards/angular/http.md`)
