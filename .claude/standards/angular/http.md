# HTTP Services — Padrão Albatroz

## Regras

1. `inject(HttpClient)` — nunca constructor injection
2. Tipagem obrigatória — sempre `Observable<TipoResponse>`
3. Sem Promises — sempre Observables
4. Sem `subscribe()` no service — deixar para o componente
5. Sem null-check em params — `{ ...request }` direto
6. Sem try/catch no service — tratamento no componente
7. Uma `API_URL` base por service

## Estrutura Base

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private readonly API_URL = environment.config.apis.erpApi;
  private readonly http = inject(HttpClient);

  listarProdutos(request: ProdutosListarRequest): Observable<PaginacaoResponse<ProdutoResponse>> {
    return this.http.get<PaginacaoResponse<ProdutoResponse>>(
      `${this.API_URL}/produtos`,
      { params: { ...request } }  // sem null-check
    );
  }

  obterProduto(id: number): Observable<ProdutoResponse> {
    return this.http.get<ProdutoResponse>(`${this.API_URL}/produtos/${id}`);
  }

  criarProduto(request: ProdutoCriarRequest): Observable<ProdutoResponse> {
    return this.http.post<ProdutoResponse>(`${this.API_URL}/produtos`, request);
  }

  atualizarProduto(id: number, request: ProdutoAtualizarRequest): Observable<ProdutoResponse> {
    return this.http.put<ProdutoResponse>(`${this.API_URL}/produtos/${id}`, request);
  }

  removerProduto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/produtos/${id}`);
  }
}
```

## Naming de Métodos

| Ação | Método |
|---|---|
| Listar paginado | `listar{Entidade}s(request)` |
| Obter por ID | `obter{Entidade}(id)` |
| Buscar (search) | `buscar{Entidade}s(filtro)` |
| Criar | `criar{Entidade}(request)` |
| Atualizar | `atualizar{Entidade}(id, request)` |
| Remover | `remover{Entidade}(id)` |
| Ação de domínio | `ativar{Entidade}(id)`, `processar{Entidade}(id)` |

## Tratamento de Erro — No Componente

```typescript
// ✅ Service — sem tratamento
listarProdutos(): Observable<ProdutoResponse[]> {
  return this.http.get<ProdutoResponse[]>(`${this.API_URL}/produtos`);
}

// ✅ Componente — com tratamento
produtos = toSignal(
  this.service.listarProdutos().pipe(
    catchError(erro => {
      this.erro.set('Falha ao carregar produtos');
      return of([]);
    })
  ),
  { initialValue: [] }
);
```

## Polling / Async (Hangfire pattern)

```typescript
iniciarProcessamento(id: number): Observable<ProcessamentoResponse> {
  return this.http.post<ProcessamentoResponse>(`${this.API_URL}/processar/${id}`, {});
}

verificarStatus(jobId: string): Observable<StatusResponse> {
  return this.http.get<StatusResponse>(`${this.API_URL}/status/${jobId}`);
}
```

## Interceptor (automático)

`core/http/auth.interceptor.ts` injeta automaticamente:
- `Authorization: Bearer {token}`
- `X-Internal-Key: {key}`

Não adicionar headers manualmente nos services.

## Environment

```typescript
// src/environments/environment.ts
export const environment = {
  config: {
    apis: {
      erpApi: 'http://localhost:5100',
      iaApi:  'http://localhost:5200'
    }
  }
};
```

Cada service usa `environment.config.apis.{api}` — nunca hardcode de URL.
