# Conventions — Naming, Estrutura, Imports

## Estrutura de Módulo

```
app/{modulo}/
├── components/        — dumb components
├── grids/             — grid configs
├── models/
│   ├── requests/      — *{Entidade}{Acao}Request.ts
│   ├── responses/     — *{Entidade}Response.ts
│   └── enum/
├── paginas/           — smart components (páginas)
└── servicos/          — HTTP services
```

## Naming

| Artefato | Padrão | Exemplo |
|---|---|---|
| Componente dumb | `{Nome}Component` | `ProdutoCardComponent` |
| Página (smart) | `{Nome}PageComponent` | `ProdutosListagemPageComponent` |
| Serviço | `{Contexto}Service` | `ProdutosService` |
| Request | `{Entidade}{Acao}Request` | `ProdutoCriarRequest` |
| Response | `{Entidade}Response` | `ProdutoResponse` |
| Grid config | `{ENTIDADE}_LISTAGEM_GRID_CONFIG()` | `PRODUTOS_LISTAGEM_GRID_CONFIG()` |
| Enum | `{Nome}Enum` | `StatusProdutoEnum` |
| Guard | `{nome}Guard` (camelCase) | `authGuard` |

## Imports — Sempre Absolutos

```typescript
// ✅ CORRETO
import { ProdutosService } from 'app/produtos/servicos/produtos.service';

// ❌ ERRADO
import { ProdutosService } from '../../servicos/produtos.service';
```

`tsconfig.json` deve ter:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "app/*": ["src/app/*"] }
  }
}
```

## Princípios Imutáveis

- Standalone components — sem NgModules
- `inject()` — nunca `constructor(private...)`
- `input()` / `output()` — nunca `@Input()` / `@Output()`
- Sem JSDoc — nomes auto-explicativos
- Sem lógica no template — computed no `.ts`
- Max 400 linhas por componente
- Template em arquivo separado (`.html`)

## Organização por Contexto de Negócio

Nunca por tipo:

```
❌ components/, services/, models/  (flat por tipo)
✅ produtos/, financeiro/, albia/   (por domínio)
```

Shared só para código genuinamente compartilhado entre 2+ contextos.
