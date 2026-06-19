# CLAUDE.md — albatroz-frontend

Frontend Angular moderno para Albatroz ERP.

---

## Stack

- **Angular 19** — standalone components, signals, inject()
- **Tailwind CSS** — utility-first styling
- **PrimeNG** — unstyled components (tabelas, forms, modais)
- **TypeScript 5.6** — strict mode
- **Node 22** — runtime

---

## Arquitetura

**Espelha o backend .NET:**

```
src/app/
├── core/                    # = IoC + Compartilhado
│   ├── auth/               # JWT, guard, interceptor
│   ├── http/               # ApiService (wrapper)
│   ├── models/             # Resultado<T>, Paginacao
│   └── tenant/             # empresa_id from JWT
├── contextos/              # = Controllers/{Contexto}
│   ├── produtos/           # models, dtos, services, routes
│   └── albia/              # models, dtos, services, routes
├── shared/                 # componentes reutilizáveis
├── layout/                 # header, sidebar
├── app.config.ts           # providers
├── app.routes.ts           # rotas lazy
└── app.component.ts        # root component
```

**DTOs:** `*Requisicao.dto.ts` (input), `*Resposta.dto.ts` (output)  
**Services:** `*.service.ts` = AppServico  
**State:** signals + `computed()` (sem NgRx)

---

## Comandos

```bash
npm install                 # deps
npm run build              # prod build
npm start                  # dev server (ng serve)
npm test                   # rodar testes
npm run lint               # ESLint
```

---

## Ambientes

**Dev (local):**
```typescript
// src/environments/environment.ts
apiUrl: 'http://localhost:5100'        // ERP
apiIaUrl: 'http://localhost:5200'      // IA
etlApiUrl: 'http://localhost:5500'     // ETL
```

**Prod (containers @ 192.168.0.190):**
```typescript
// src/environments/environment.prod.ts
apiUrl: 'http://192.168.0.190:5100'    // ERP
apiIaUrl: 'http://192.168.0.190:5200'  // IA (quando online)
etlApiUrl: 'http://192.168.0.190:5302' // ETL
```

Status: ERP ✅ | IA ❌ | Site ✅ | ETL ✅

---

## Spec externa — Extração Fatura v2

Ver spec completa em:
`D:\GIT\albatroz-backend\.claude\specs\extracao-fatura-v2-frontend.md`

---

## Docker

```bash
docker build -t albatroz-frontend:latest .
docker run -p 80:80 albatroz-frontend:latest
```

**nginx.conf:** SPA routing (`try_files`), cache assets (1y), health check.

---

## GitHub Actions

**ci.yml:** build on push (master/develop), upload artefato.

**deploy stub:** comentado. Descomentar quando servidor estiver pronto.
- SSH deploy via `appleboy/ssh-action`
- Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`

---

## Padrões

| Contexto | Responsabilidade |
|---|---|
| `core/` | auth, HTTP, modelos genéricos, tenant |
| `contextos/` | lógica de negócio por feature |
| `shared/` | componentes genéricos (tabela, paginação) |
| `layout/` | header, sidebar, estrutura comum |

**Sem exceções** em services — use `Resultado<T>` sempre.  
**Lazy loading** de rotas — cada contexto tem seu próprio route.  
**Interceptor** injeta Bearer + X-Internal-Key automaticamente.

---

## TODO

- [ ] Componentes de lista/detalhe (Produtos, Albia)
- [ ] Login component
- [ ] Dashboard
- [ ] Shared component library (tabela, paginação, erro-display)
- [ ] Testes unitários (Jasmine/Karma)
- [ ] E2E tests (Cypress/Playwright)
- [ ] PrimeNG unstyled customização
- [ ] Validação de forms (Angular Forms API)
- [ ] Upload de arquivos (image picker, file upload)
