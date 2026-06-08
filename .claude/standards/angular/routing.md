# Routing — Lazy Loading, Guards, Params

## Convenções de URL

| Padrão | URL |
|---|---|
| Listagem | `/produtos` |
| Cadastro | `/produtos/cadastro` |
| Detalhe | `/produtos/123` |
| Edição | `/produtos/123/edicao` |
| Sub-contexto | `/produtos/categorias/cadastro` |

**Regras:**
- Contexto no **plural** (`/produtos`, `/fornecedores`)
- Hífens para nomes compostos (`/relatorio-de-estoque`)
- Português, descritivo (`/cadastro` não `/new`, `/edicao` não `/edit`)
- Rotas fixas declaradas **antes** de `:id` (Angular resolve em ordem)

## app.routes.ts

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('app/auth/paginas/login-page/login-page.component')
        .then(m => m.LoginPageComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'produtos',
        loadChildren: () =>
          import('app/produtos/produtos.routes').then(m => m.produtosRoutes)
      },
      {
        path: 'financeiro',
        loadChildren: () =>
          import('app/financeiro/financeiro.routes').then(m => m.financeiroRoutes)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

## Rotas por Módulo

```typescript
// app/produtos/produtos.routes.ts
export const produtosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./paginas/produtos-listagem-page/produtos-listagem-page.component')
        .then(m => m.ProdutosListagemPageComponent),
    title: 'Produtos'
  },
  {
    path: 'cadastro',      // ← ANTES do :id
    loadComponent: () =>
      import('./paginas/produto-cadastro-page/produto-cadastro-page.component')
        .then(m => m.ProdutoCadastroPageComponent),
    title: 'Novo Produto'
  },
  {
    path: ':id/edicao',
    loadComponent: () =>
      import('./paginas/produto-edicao-page/produto-edicao-page.component')
        .then(m => m.ProdutoEdicaoPageComponent),
    title: 'Editar Produto'
  },
  {
    path: ':id',           // ← DEPOIS das rotas fixas
    loadComponent: () =>
      import('./paginas/produto-detalhe-page/produto-detalhe-page.component')
        .then(m => m.ProdutoDetalhePageComponent),
    title: 'Produto'
  }
];
```

## Params como Signal

```typescript
private readonly route = inject(ActivatedRoute);

readonly id = toSignal(
  this.route.paramMap.pipe(map(p => Number(p.get('id')))),
  { initialValue: 0 }
);

readonly slug = toSignal(
  this.route.paramMap.pipe(map(p => p.get('slug') ?? '')),
  { initialValue: '' }
);
```

## Guard

```typescript
// app/shared/guards/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAutenticado()) return true;
  router.navigate(['/login']);
  return false;
};
```

## Navegação Programática

```typescript
// Absoluta
this.router.navigate(['/produtos']);
this.router.navigate(['/produtos', id, 'edicao']);

// Relativa
this.router.navigate(['..'], { relativeTo: this.route });          // volta para listagem
this.router.navigate(['..', 'edicao'], { relativeTo: this.route }); // detalhe → edição
```

## Checklist Novo Módulo

- [ ] `app/{modulo}/{modulo}.routes.ts`
- [ ] Rotas fixas antes de `:id`
- [ ] `loadComponent` em todas (sem `component:` direto)
- [ ] `title` em cada rota
- [ ] Registrar em `app.routes.ts` com `loadChildren`
- [ ] Guard `canActivate` se rota protegida
