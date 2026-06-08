# Exemplo — Configuração de Rotas

Exemplo canônico de routes com lazy loading.

**Fonte:** `src/app/contextos/financeiro/cartoes/cartoes.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const CARTOES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./cartoes-dashboard/cartoes-dashboard.component').then(m => m.CartoesDashboardComponent)
  },
  {
    path: 'upload',
    loadComponent: () =>
      import('./fatura-upload/fatura-upload.component').then(m => m.FaturaUploadComponent)
  }
];
```

**Integração no route pai** (`app.routes.ts` ou route do contexto):

```typescript
{
  path: 'financeiro/cartoes',
  loadChildren: () =>
    import('./contextos/financeiro/cartoes/cartoes.routes').then(m => m.CARTOES_ROUTES)
}
```

**Padrões ilustrados:**

- Nome da constante: `{CONTEXTO}_ROUTES` — SCREAMING_SNAKE_CASE
- `loadComponent` — lazy load individual (não `loadChildren` com módulo)
- `path: ''` — rota padrão do sub-contexto sem barra
- Nunca importar o componente diretamente no route — sempre `loadComponent` para lazy
- Rota pai usa `loadChildren` apontando pro arquivo de routes do contexto
- Path usa kebab-case: `financeiro/cartoes`, `fatura-upload`, não camelCase

**Acesso a parâmetros de rota (Signals API):**

```typescript
import { input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

// Em componente de detalhe
private route = inject(ActivatedRoute);
id = toSignal(this.route.params.pipe(map(p => +p['id'])));
```
