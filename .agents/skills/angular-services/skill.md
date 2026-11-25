---
name: angular-services
description: Padrão de HTTP Services em Angular. Injeção via inject(), tipagem obrigatória, sem Promises.
---

# Angular Services — HTTP Pattern

## Padrão Básico

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaginacaoResponse } from 'app/shared/models/responses/paginacao.response';
import { UsuariosListarRequest } from '../models/requests/usuarios-listar.request';
import { UsuarioResponse } from '../models/responses/usuario.response';

export class UsuariosService {
  // Uma URL base por serviço
  private readonly API_URL = environment.config.apis.usuarioApi;
  private readonly http = inject(HttpClient);

  listarUsuarios(request: UsuariosListarRequest): Observable<PaginacaoResponse<UsuarioResponse>> {
    return this.http.get<PaginacaoResponse<UsuarioResponse>>(
      `${this.API_URL}/usuarios`,
      { params: { ...request } }  // ← direto, sem verificação null
    );
  }

  obterUsuario(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.API_URL}/usuarios/${id}`);
  }

  criarUsuario(request: UsuarioCriarRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.API_URL}/usuarios`, request);
  }

  atualizarUsuario(id: number, request: UsuarioAtualizarRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.API_URL}/usuarios/${id}`, request);
  }

  removerUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/usuarios/${id}`);
  }
}
```

## Regras

1. **Nomeação:** `{Contexto}Service` — ex: `UsuariosService`, `ProdutosService`
2. **Uma URL base** — `environment.config.apis.{api}`
3. **Injetar via `inject()`** — não constructor
4. **Tipagem obrigatória** — sempre `Observable<TipoResponse>`
5. **Sem verificação null/undefined em params** — passe `{ ...request }` direto
6. **Sem JSDoc** — nome do método descreve
7. **Sem Promises** — sempre Observables
8. **Sem subscribe()** — deixar para o componente/template (`async` pipe ou `toSignal()`)

## Métodos Padrão — Naming

```typescript
export class ProdutosService {
  // Leitura
  listarProdutos(request): Observable<PaginacaoResponse<ProdutoResponse>> { }
  obterProduto(id): Observable<ProdutoResponse> { }
  buscarProdutos(filtro): Observable<ProdutoResponse[]> { }
  
  // Escrita
  criarProduto(request): Observable<ProdutoResponse> { }
  atualizarProduto(id, request): Observable<ProdutoResponse> { }
  removerProduto(id): Observable<void> { }
  
  // Ações
  ativarProduto(id): Observable<ProdutoResponse> { }
  inativarProduto(id): Observable<ProdutoResponse> { }
  processarEmLote(ids): Observable<void> { }
}
```

## Tratamento de Erros — No Componente

```typescript
// NO SERVICE — sem tratamento
export class ProdutosService {
  listarProdutos(request): Observable<ProdutoResponse[]> {
    return this.http.get<ProdutoResponse[]>(`${this.API_URL}/produtos`);
  }
}

// NO COMPONENTE — tratamento
export class ProdutosComponent {
  private readonly service = inject(ProdutosService);

  produtos$ = this.service.listarProdutos().pipe(
    catchError(erro => {
      console.error('Erro ao buscar produtos', erro);
      return of([]); // retorna vazio em caso de erro
    })
  );
}
```

## Requisições com Parâmetros

```typescript
// ✅ CORRETO — passe request direto
public listarItensNaoIntegrados(request: ItensNaoIntegradosListarRequest): 
  Observable<PaginacaoResponse<ItemNaoIntegradoResponse>> {
  return this.http.get<PaginacaoResponse<ItemNaoIntegradoResponse>>(
    `${this.urlIntegracaoErpApi}int-app/estoques/itens-nao-integrados`,
    { params: { ...request } }
  );
}

// ❌ ERRADO — verificação desnecessária
public listarItensNaoIntegrados(request: ItensNaoIntegradosListarRequest): 
  Observable<PaginacaoResponse<ItemNaoIntegradoResponse>> {
  return this.http.get<PaginacaoResponse<ItemNaoIntegradoResponse>>(
    `${this.urlIntegracaoErpApi}int-app/estoques/itens-nao-integrados`,
    {
      params: {
        ...(request.DataInicial && { DataInicial: request.DataInicial }),
        ...(request.DataFinal && { DataFinal: request.DataFinal }),
        // ... muitas linhas de verificação
      }
    }
  );
}
```

## Uso no Componente

```typescript
export class ProdutosPageComponent {
  private readonly service = inject(ProdutosService);

  // Observable direto
  produtos$ = this.service.listarProdutos();

  // Signal a partir de Observable
  produtos = toSignal(
    this.filtro$.pipe(
      debounceTime(300),
      switchMap(f => this.service.buscarProdutos(f))
    ),
    { initialValue: [] }
  );

  // Template (async pipe)
  // <div>{{ produtos$ | async }}</div>

  // Ação (create, update, delete)
  criarProduto(request: ProdutoCriarRequest) {
    this.service.criarProduto(request).subscribe(
      produto => {
        console.log('Criado:', produto);
        // atualizar lista, navegar, etc
      }
    );
  }
}
```

## Environment Config

`src/environments/environment.ts`:
```typescript
export const environment = {
  config: {
    apis: {
      usuarioApi: 'https://api.exemplo.com/usuarios',
      produtosApi: 'https://api.exemplo.com/produtos',
      integracaoErpApi: 'https://api.exemplo.com/integracao/erp'
    }
  }
};
```

## Reutilização e Cache

Para queries pesadas, cache em Signal:

```typescript
export class ProdutosService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.config.apis.produtosApi;
  
  private produtosCached = signal<ProdutoResponse[] | null>(null);

  listarProdutos(): Observable<ProdutoResponse[]> {
    const cached = this.produtosCached();
    if (cached) {
      return of(cached);  // retorna do cache
    }
    
    return this.http.get<ProdutoResponse[]>(`${this.API_URL}/produtos`)
      .pipe(
        tap(produtos => this.produtosCached.set(produtos)),
        shareReplay(1)
      );
  }

  invalidarCache() {
    this.produtosCached.set(null);
  }
}
```

> **Quando o Design System estiver disponível:** Substituir `import { PaginacaoResponse } from 'app/shared/models/responses/paginacao.response'` por `import { PaginacaoResponse } from '@ds/utils'` e remover `app/shared/models/responses/paginacao.response.ts`.
```
