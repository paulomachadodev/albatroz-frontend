# Agents — Albatroz Frontend

Routing guide for AI agents (Claude Code, Codex, Cursor, Aider, etc.)

For Claude Code: agents are defined in `.claude/agents/*.md` with full context.
For other agents: use this file as the routing reference.

## Project Overview

Angular 19 standalone SPA for Albatroz Papelaria ERP system.
Stack: Angular 19, TypeScript 5.6, Tailwind CSS, PrimeNG unstyled, Node 22

## Agent Routing

| Task | Agent | Trigger keywords |
|------|-------|-----------------|
| Architecture decisions, patterns, routing structure | `frontend-architect` | "how to structure", "should I separate", "which pattern", "design" |
| Angular components, services, HTTP, DTOs, routes | `angular-engineer` | "create component", "add service", "implement feature", "fix" |
| UI design, tokens, cards, tables, forms, layouts | `ds-engineer` | "style", "design", "layout", "card", "table", "form", "color" |

## Key Patterns

- **Standalone components**: no NgModules, `inject()` for DI
- **Signals**: `input()`/`output()`/`computed()`/`effect()` — no `@Input/@Output`
- **No NgRx**: state via signals in services `providedIn: 'root'`
- **Lazy loading**: by context (`loadChildren`) via `{contexto}.routes.ts`
- **HTTP**: `Observable<Resultado<T>>`, never Promise, no `subscribe()` in services
- **Design System**: Tailwind + Albatroz DS tokens (slate/blue, corporate)
- **Multi-tenant**: `empresa_id` from JWT via `TenantService`

## Implemented Contexts

| Context | Status | Notes |
|---------|--------|-------|
| autenticacao | ✅ Done | Login, EsqueciSenha, JWT guard |
| financeiro/cartoes | ✅ Done | Cartões, faturas, upload PDF async |
| dashboard | 🔧 Scaffold | Empty — needs KPIs |
| fornecedores | 🔧 Scaffold | No UI yet |
| produtos | 🔧 Scaffold | Models + service, no UI |
| albia | 🔧 Scaffold | Models + service, no UI |

## Cross-Project Routing

```
albatroz-frontend → calls → Albatroz.ERP.API (localhost:5100 dev / api-erp.albatrozpapelaria.com.br prod)
                  → calls → Albatroz.IA.API  (localhost:5200 dev / api-ia.albatrozpapelaria.com.br prod)
Backend code: albatroz-backend repo
Site frontend: albatroz-site repo
```

## Environment

See `.claude/standards/env-vars.md`
Dev: `http://localhost:4200` | Prod: Nginx port 80 via Cloudflare Tunnel

## Deploy

Push to `main` → GitHub Actions → runner `infra-sv01` → Docker build → nginx
See `.claude/standards/deploy.md`

## SDD

- Specs in `.claude/specs/*.md`
- Status: `rascunho` → `aprovado` → `implementado` → `obsoleto`
- No feature without approved spec
