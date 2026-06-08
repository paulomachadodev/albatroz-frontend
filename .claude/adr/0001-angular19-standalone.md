# ADR-0001 — Angular 19 com Standalone Components

**Status:** Aceito  
**Data:** 2026-06-01  
**Número:** 0001

---

## Contexto

O Albatroz ERP frontend precisava de um framework SPA robusto para construir um ERP corporativo multi-contexto. A arquitetura de módulos NgModules do Angular tradicional gerava boilerplate excessivo e dificultava o tree-shaking. Angular 19 introduziu standalone components como padrão, eliminando NgModules na maioria dos casos.

---

## Decisão

Adotamos **Angular 19 com standalone components** como framework e arquitetura base.

Todas as features usam:
- `standalone: true` em todos os componentes, directives e pipes.
- `inject()` para injeção de dependências (sem `constructor` DI).
- Signals (`signal`, `computed`, `effect`) para estado reativo.
- `input()` / `output()` signals-based para comunicação entre componentes.
- TypeScript 5.6 em strict mode.

---

## Alternativas Consideradas

| Alternativa | Por que descartada |
|-------------|-------------------|
| React + Next.js | Time com mais experiência em Angular; integração com PrimeNG já validada no ecossistema Angular |
| Vue 3 | Menor adoção em ERPs corporativos; ecossistema de componentes enterprise menos maduro |
| Angular com NgModules (legado) | Boilerplate desnecessário; standalone é o padrão oficial do Angular 19 |
| Svelte / SolidJS | Maturidade e ecossistema enterprise insuficientes para um ERP de longo prazo |

---

## Consequências

**Positivas:**
- Zero NgModules reduz boilerplate e torna cada componente autocontido.
- `inject()` simplifica DI e melhora testabilidade.
- Signals eliminam a necessidade de NgRx/RxJS complexo para estado local e de página.
- Tree-shaking mais eficiente — bundle menor.
- Lazy loading por rota funciona sem módulo intermediário.

**Negativas / Trade-offs:**
- Curva de aprendizado para desenvolvedores acostumados com NgModules.
- Alguns pacotes de terceiros ainda assumem NgModules — necessário verificar compatibilidade.

**Ações decorrentes:**
- Nenhum NgModule novo deve ser criado — exceção apenas para compatibilidade forçada por lib.
- Todo componente novo usa `standalone: true` por padrão.
