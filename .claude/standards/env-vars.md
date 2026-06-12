---
name: env-vars
description: Variáveis de ambiente do Angular frontend — environment.ts, URLs de API, sem secrets em runtime
metadata:
  type: standard
---

# Variáveis de Ambiente — Albatroz Frontend (Angular)

## Angular não tem secrets em runtime

O frontend Angular compila as URLs de API nos arquivos `environment.ts`. Não há secrets no bundle — apenas URLs públicas das APIs.

## Arquivos de environment

```
src/environments/
├── environment.ts          ← desenvolvimento (localhost)
└── environment.prod.ts     ← produção (URLs públicas)
```

### environment.ts (dev)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5100',    // Albatroz.ERP.API
  apiIaUrl: 'http://localhost:5200',  // Albatroz.IA.API
};
```

### environment.prod.ts (prod)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api-erp.albatrozpapelaria.com.br',
  apiIaUrl: 'https://api-ia.albatrozpapelaria.com.br',
};
```

## GitHub Actions — sem secrets necessários

O build Angular para produção usa `ng build --configuration production`, que substitui `environment.ts` por `environment.prod.ts` automaticamente via `fileReplacements` no `angular.json`.

Nenhum GitHub Secret necessário além de `GITHUB_TOKEN` (padrão).

## Como acessar environment em componentes/serviços

```typescript
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ErpService {
  private readonly apiUrl = environment.apiUrl;
  // ...
}
```

## Adicionar nova URL/config de ambiente

1. Adicionar em `environment.ts` (valor dev)
2. Adicionar em `environment.prod.ts` (valor prod)
3. Tipar o objeto `environment` com interface se necessário
4. Não usar `environment.production` como flag de feature — use feature flags separados
