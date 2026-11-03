# AGENTS.md — albatroz-frontend

Dual-use: Claude Code (lê `.claude/agents/*.md`) + Codex (lê este arquivo).
Branch: `master` | Prod: `http://192.168.0.190:80` (Angular via Docker/nginx)

## Regras Hard (invioláveis)

1. **Sem comentários** — zero `//` `/* */` JSDoc em qualquer `.ts`/`.html`. Melhora o nome.
2. **empresa_id obrigatório** — toda chamada de serviço passa `empresa_id` via `TenantService`.
3. **Standalone** — zero NgModules. `inject()` para DI, nunca constructor injection manual.
4. **Signals** — `input()`/`output()`/`computed()`/`effect()`. Zero `@Input`/`@Output` decorators.
5. **Sem NgRx** — state via signals em services `providedIn: 'root'`.
6. **Lazy loading** — por contexto (`loadChildren`) via `{contexto}.routes.ts`.
7. **HTTP** — `Observable<Resultado<T>>`, nunca Promise, nunca `subscribe()` dentro de services.
8. **PrimeNG first** — verificar componente PrimeNG antes de criar custom.
9. **Carregar standards UI antes de qualquer HTML** — `template-estrutura.md` + `listagem-padrao.md`.
10. **Grep antes de criar** — buscar componente similar em `src/shared/` e `src/contextos/`.
11. **Feature back+front** — só entregue com as duas pontas prontas.
12. **Spec antes de código** — feature sem spec aprovada = não implementar.
13. **Após tarefa** — `npm test` primeiro; se passar → commit + push em `master` via subagente Haiku.

## Stack

Angular 19 standalone | TypeScript 5.6 strict | Tailwind CSS | PrimeNG unstyled | Node 22

## Agent Routing

| Tarefa | Agente | Palavras-chave |
|--------|--------|----------------|
| Arquitetura, patterns, estrutura de rotas | `frontend-architect` | structure, pattern, design |
| Componentes, services, HTTP, DTOs | `angular-engineer` | create component, service, feature, fix |
| UI design, tokens, cards, tabelas, forms | `ds-engineer` | style, design, layout, card, table, form |

Agentes completos (Claude Code): `.claude/agents/*.md`

## Standards — Index para Codex

| Path | Quando usar |
|------|-------------|
| `.claude/standards/angular/conventions.md` | naming, estrutura de arquivos |
| `.claude/standards/angular/template-estrutura.md` | **qualquer HTML novo** — obrigatório |
| `.claude/standards/angular/listagem-padrao.md` | **qualquer listagem/página** — obrigatório |
| `.claude/standards/angular/signals.md` | state management, computed |
| `.claude/standards/angular/http.md` | chamadas HTTP, interceptors |
| `.claude/standards/angular/forms.md` | formulários reativos |
| `.claude/standards/angular/routing.md` | rotas lazy, guards |
| `.claude/standards/angular/mobile-operacional.md` | responsividade mobile |
| `.claude/standards/angular/mensagens-feedback.md` | toasts, erros, loading |
| `.claude/standards/deploy.md` | CI/CD, GitHub Actions |
| `.claude/standards/env-vars.md` | environments, apiUrl |

Specs: `.claude/specs/*.md` | Domínio: `.claude/domain/*.md`

## Contextos Implementados

| Contexto | Status | Notas |
|----------|--------|-------|
| autenticacao | ✅ | Login, JWT guard, interceptor |
| financeiro/cartoes | ✅ | Faturas, upload PDF async |
| dashboard | 🔧 | Scaffold — sem KPIs |
| fornecedores | 🔧 | Sem UI |
| produtos | 🔧 | Models + service, sem UI |
| albia | 🔧 | Models + service, sem UI |

## Cross-Project

Backend: `D:\GIT\albatroz-backend` | ERP API: `http://192.168.0.190:5100` | IA API: `http://192.168.0.190:5200`
Deploy: push `master` → GitHub Actions (`ci.yml`) → runner `infra-sv01` → docker pull + run porta 80
