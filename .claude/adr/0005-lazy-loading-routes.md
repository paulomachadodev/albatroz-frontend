# ADR-0005 — Lazy loading por contexto de negócio

**Status:** Aceito  
**Data:** 2026-06-01  
**Número:** 0005

---

## Contexto

O ERP tem múltiplos contextos de negócio (financeiro, produtos, albia, fornecedores, etc.) que crescem independentemente. Sem lazy loading, o bundle inicial carrega todo o código de todos os contextos, aumentando o tempo de carregamento inicial mesmo para usuários que só usam um subconjunto das funcionalidades.

---

## Decisão

Adotamos **lazy loading por contexto** no roteamento Angular.

Cada contexto (`financeiro`, `produtos`, `albia`, `fornecedores`, etc.) tem seu próprio arquivo `*.routes.ts` carregado via `loadChildren` no `app.routes.ts`. O bundle inicial contém apenas `core/` e `layout/`.

Estrutura:
```
app.routes.ts
  └── loadChildren(() => import('./contextos/financeiro/...'))
  └── loadChildren(() => import('./contextos/produtos/...'))
  └── ...
```

---

## Alternativas Consideradas

| Alternativa | Por que descartada |
|-------------|-------------------|
| Bundle único (eager loading) | Bundle inicial cresce com cada contexto — inaceitável para ERP em expansão |
| Lazy loading por componente (loadComponent) | Granularidade excessiva para contextos; routes por contexto é o nível correto |
| Preloading Strategy (PreloadAllModules) | Anula o benefício do lazy loading no carregamento inicial |

---

## Consequências

**Positivas:**
- Bundle inicial mínimo — apenas core e layout.
- Cada contexto novo não penaliza o carregamento inicial.
- Code splitting automático pelo Angular CLI por rota lazy.
- Isolamento: bug em um contexto não quebra o bundle de outro.

**Negativas / Trade-offs:**
- Primeira navegação para um contexto tem latência de carregamento do chunk.
- Guards de autenticação precisam ser aplicados nas rotas lazy (não apenas na raiz).

**Ações decorrentes:**
- Todo contexto novo cria seu `*.routes.ts` e é referenciado via `loadChildren` no `app.routes.ts`.
- Guards (`AuthGuard`) aplicados por rota ou por grupo de rotas no arquivo de rotas do contexto.
