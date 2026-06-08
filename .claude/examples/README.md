# Examples — Exemplos Reais do Código

Exemplos canônicos extraídos de `src/` (nunca fabricados). Regra: **código real > explicação longa**.

Quando uma skill descreve padrão abstrato, leia o exemplo correspondente para ver implementação real.

## Categorias

| Pasta | Padrão | Skill / Standard de referência |
|---|---|---|
| [`service/`](service/README.md) | HTTP Service com `inject()`, `Observable<Resultado<T>>`, rotas base | `@standards/angular/http.md`, `@skills/angular-services` |
| [`page/`](page/README.md) | Smart Component — signals, computed(), ngOnInit, carregamento de dados | `@standards/angular/signals.md`, `@skills/angular-pages` |
| [`component/`](component/README.md) | Dumb Component — `input()`, `output()`, `model()`, `inject()`, lógica local | `@standards/angular/signals.md`, `@skills/angular-components` |
| [`request/`](request/README.md) | DTO de entrada (`*Requisicao`) — interface TypeScript simples, opcionais explícitos | `@skills/angular-requests` |
| [`response/`](response/README.md) | Model de resposta — interface TypeScript com campos do backend, nesting | `@skills/angular-responses` |
| [`route/`](route/README.md) | Configuração de rotas — lazy loading, `loadComponent`, `CONTEXT_ROUTES` | `@standards/angular/routing.md`, `@skills/angular-routes` |

## Como usar

Ao criar novo serviço, veja `service/README.md`. Ao criar nova página, veja `page/README.md` + `route/README.md`. Ao criar componente reutilizável, veja `component/README.md`.
