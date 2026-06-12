# Contexto de Projeto — Frontend

## Stack

- Angular 19 — standalone components, signals, inject()
- Tailwind CSS — utility-first styling
- PrimeNG — unstyled components (tabelas, forms, modais)
- TypeScript 5.6 strict mode
- Node 22

## Contextos Implementados

| Contexto | Status | Observações |
|---|---|---|
| `autenticacao` | ✅ Login + EsqueciSenha | UI pronta, JWT guard |
| `dashboard` | 🔧 Scaffolded | Componente vazio |
| `financeiro/cartoes` | ✅ Completo | Cartões, faturas, upload, extração async via Hangfire |
| `fornecedores` | 🔧 Scaffolded | Rota + componente básico |
| `produtos` | 🔧 Scaffolded | Models + DTOs + service, sem UI |
| `albia` | 🔧 Scaffolded | Models + DTOs + service, sem UI |

## Violações Conhecidas — Corrigir

### 1. Falta de lazy loading em subrotas

**Localização:** `financeiro/cartoes/cartoes.routes.ts`
**Problema:** Verificar se todos os filhos usam `loadComponent` corretamente
**Solução:** Garantir lazy loading em todas as rotas folha

### 2. DTOs misturados com Models

**Localização:** `contextos/financeiro/cartoes/dtos/`
**Problema:** Alguns campos de `cartao-requisicao.dto.ts` duplicam model
**Solução:** Models = dados internos; DTOs = shape da API. Separar responsabilidades

### 3. Serviços sem tipagem de retorno explícita

**Localização:** Múltiplos services
**Problema:** `return this.http.get(...)` sem `Observable<Resultado<T>>`
**Solução:** Todo service deve tipar retorno explicitamente com `Resultado<T>`

### 4. Dashboard sem conteúdo

**Localização:** `contextos/dashboard/dashboard.component.*`
**Problema:** Componente scaffolded vazio
**Solução:** Implementar KPIs, cards de status, acesso rápido

## URLs & Ambientes

| Ambiente | Frontend | API ERP | API IA |
|---|---|---|---|
| Dev | `localhost:4200` | `localhost:5100` | `localhost:5200` |
| Prod | Nginx port 80 | `192.168.0.180:8080` | `192.168.0.180:8081` |

## Infraestrutura

### Extração de Fatura (Async)

**Flow:** Upload PDF → POST `/financeiro/faturas/extrair` → job Hangfire no backend → polling frontend a cada 2s → resultado exibido
**Componente:** `fatura-upload.component.ts`
**Status:** Implementado e funcional

### Docker

Build: `docker build -t albatroz-frontend:latest .`
Nginx: SPA routing (`try_files`), assets cache 1 ano, health check `/health`

## Regras de Ouro

- ❌ Nunca usar `Promise` em services — só `Observable`
- ❌ Nunca NgRx — state via signals + `computed()`
- ❌ Nunca `any` — TypeScript strict sempre
- ✅ Todo HTTP service retorna `Observable<Resultado<T>>`
- ✅ Interceptor injeta Bearer + X-Internal-Key automaticamente
- ✅ Lazy loading em todas as rotas de contexto
- ✅ Standalone components sempre — sem NgModules
- ✅ `inject()` para injeção de dependência — nunca constructor injection
- ✅ `empresa_id` sempre vem do JWT via `TenantService`

## Backlog

- [ ] Login component estilizado com DS tokens
- [ ] Dashboard com KPIs reais
- [ ] Tela de Produtos (listagem + detalhe)
- [ ] Tela Albia (busca semântica + resultados IA)
- [ ] Tela Fornecedores (CRUD)
- [ ] Shared: tabela paginada reutilizável
- [ ] Shared: componente erro-display
- [ ] Testes unitários (Jasmine/Karma)
- [ ] E2E (Cypress ou Playwright)

---

## Env Vars

Angular não tem secrets em runtime. Config em `src/environments/`:

| Var | Dev | Prod |
|-----|-----|------|
| `apiUrl` | `http://localhost:5100` | `https://api-erp.albatrozpapelaria.com.br` |
| `apiIaUrl` | `http://localhost:5200` | `https://api-ia.albatrozpapelaria.com.br` |

Para adicionar nova config: atualizar `environment.ts` + `environment.prod.ts`. Ver `.claude/standards/env-vars.md`.

## Deploy

Push main → GitHub Actions (runner infra-sv01 em 192.168.0.190) → `ng build --configuration production` → Docker build → nginx.

Ver `.claude/standards/deploy.md` para workflow completo.

## Cross-Project

Backend (ERP + IA APIs): repo `albatroz-backend`
Site público: repo `albatroz-site`
Infra cross-project: `albatroz-backend/.claude/contexts/proyecto/infra.md`
