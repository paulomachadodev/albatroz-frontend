# CLAUDE.md — albatroz-frontend

Frontend Angular moderno para Albatroz ERP.

---

## ⚠️ TERMINANTEMENTE PROIBIDO: comentários em código

**Nenhum comentário em nenhum arquivo de código deste repo** — nem `//`, nem `/* */`, nem JSDoc. Sem exceção. Se o "why" não é óbvio, melhora o nome do identificador ou extrai um método com nome descritivo — nunca comenta.

Checado antes de todo commit/push — ver skill `revisao-pre-commit`.

---

## ⚠️ Antes de escrever QUALQUER UI (obrigatório)

Ler `.claude/standards/angular/listagem-padrao.md` inteiro antes de criar botão, toggle, tabela, modal, drawer, listagem, coluna de ações ou fluxo de salvar — nessa ordem de prioridade. Esse standard já resolve: botão de ação (`app-btn-icone`, nunca link cru pra 2+ ações), liga/desliga (`app-toggle`, nunca checkbox cru), listagem paginada, modal, drawer, dropdown de ações em massa, e a regra de **1 botão Salvar por registro** (nunca 1 por seção/aba do mesmo formulário). Criar um desses do zero sem checar aqui primeiro é bug, não estilo — já aconteceu (2026-08-21: telas de produto nasceram com botão Salvar espalhado e sem usar o padrão de ação existente porque esse arquivo não foi lido antes).

---

## ⚠️ Antes de commit/push (obrigatório)

Toda alteração de código neste repo passa pela skill `code-review` (`/code-review`) antes do commit/push — não só a pré-revisão de comentários (`revisao-pre-commit`). Rodar no diff da mudança, aplicar os achados relevantes, só então commitar e dar push.

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

**ci.yml:** deploy automático já ativo (2026-07-29, doc anterior estava desatualizada) — push na `master` builda, publica imagem no GHCR e redeploya o container via runner self-hosted (`docker pull` + `docker run` na porta 8080). Não precisa de passo manual — commit + push já é suficiente. Mesmo padrão em `albatroz-backend` e `albatroz-site`.

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
