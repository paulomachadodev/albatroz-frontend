---
name: angular-routes
description: Padrão de Rotas Angular no Albatroz ERP. Convenções de URL, lazy loading, guards, acesso a params com Signals.
---

# Rotas — Padrão Albatroz

## Convenções de URL

**Estrutura:** `/{contexto}` | `/{contexto}/{acao}` | `/{contexto}/{param}/{acao}`

| Padrão | URL | Descrição |
|--------|-----|-----------|
| Listagem | `/produtos` | Tela de listagem |
| Detalhe por ID | `/produtos/123` | Detalhe interno (ERP) |
| Detalhe por slug | `/produtos/caderno-a4-faber-castell` | Detalhe público (catálogo) |
| Cadastro | `/produtos/cadastro` | Nova criação |
| Edição | `/produtos/123/edicao` | Editar registro existente |
| Sub-contexto | `/produtos/categorias/cadastro` | Ação dentro de classificador |
| Relatório | `/produtos/relatorio-de-estoque` | Tela descritiva |

**Regras:**
- Contexto sempre no **plural** (`/produtos`, `/fornecedores`)
- Nomes compostos com **hífen** (`/relatorio-de-estoque`, `/123/edicao`)
- Ações em português e descritivas (`/cadastro`, `/edicao`, não `/new`, `/edit`)

## Dois Cenários para Detalhe de Produto

### ERP Interno — ID numérico

Para telas administrativas onde o usuário é interno e SEO não importa:

```
/produtos/123           → detalhe do produto 123
/produtos/123/edicao    → editar produto 123
/produtos/123/imagens   → gerenciar imagens do produto 123
```

### Catálogo Público — Slug

Para telas de exibição pública onde SEO e legibilidade importam:

```
/produtos/caderno-a4-faber-castell          → página pública do produto
/produtos/caderno-a4-faber-castell/avaliacoes → avaliações do produto
```

**Como distinguir slug de ID no mesmo contexto:**

Angular resolve pela ordem das rotas. Declare rotas fixas (`cadastro`, `categorias`) **antes** do parâmetro dinâmico:

```typescript
const produtosRoutes: Routes = [
  { path: '', component: ProdutosListagemPageComponent },
  { path: 'cadastro', component: ProdutoCadastroPageComponent },          // ← antes do :id
  { path: ':id', component: ProdutoDetalhePageComponent },                // ERP (ID numérico)
  { path: ':slug', component: ProdutoCatalogoPageComponent },             // catálogo (slug)
  { path: ':id/edicao', component: ProdutoEdicaoPageComponent },
  { path: ':id/imagens', component: ProdutoImagensPageComponent },
];
```

Quando os dois coexistem, use **prefixo de rota** para separar:

```typescript
const routes: Routes = [
  {
    path: 'produtos',
    children: [
      { path: '', component: ProdutosListagemPageComponent },
      { path: 'cadastro', component: ProdutoCadastroPageComponent },
      { path: ':id/edicao', component: ProdutoEdicaoPageComponent },
      { path: ':id', component: ProdutoDetalhePageComponent },       // interno
    ]
  },
  {
    path: 'catalogo/produtos',
    children: [
      { path: ':slug', component: ProdutoCatalogoPageComponent },    // público
    ]
  }
];
```

## Estrutura de Rotas — app.routes.ts

```typescript
// app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from 'app/shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
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
          import('app/produtos/produtos.routes')
            .then(m => m.produtosRoutes)
      },
      {
        path: 'fornecedores',
        loadChildren: () =>
          import('app/fornecedores/fornecedores.routes')
            .then(m => m.fornecedoresRoutes)
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
```

## Rotas por Módulo

```typescript
// app/produtos/produtos.routes.ts
import { Routes } from '@angular/router';

export const produtosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./paginas/produtos-listagem-page/produtos-listagem-page.component')
        .then(m => m.ProdutosListagemPageComponent),
    title: 'Produtos'
  },
  {
    path: 'cadastro',
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
    path: ':id',
    loadComponent: () =>
      import('./paginas/produto-detalhe-page/produto-detalhe-page.component')
        .then(m => m.ProdutoDetalhePageComponent),
    title: 'Produto'
  },
];
```

## Acessar Params — Signal

```typescript
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export class ProdutoDetalhePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProdutosService);

  // ✅ Param como signal reativo
  readonly id = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('id')))),
    { initialValue: 0 }
  );

  produto: ProdutoResponse | null = null;

  ngOnInit() {
    this.carregarProduto();
  }

  private async carregarProduto() {
    this.produto = await firstValueFrom(this.service.obter(this.id()));
  }

  navegarParaEdicao() {
    this.router.navigate(['..', 'edicao'], { relativeTo: this.route });
  }
}
```

Para slug:
```typescript
// Rota: /catalogo/produtos/:slug
readonly slug = toSignal(
  this.route.paramMap.pipe(map(p => p.get('slug') ?? '')),
  { initialValue: '' }
);
```

## Guard — Autenticação

```typescript
// app/shared/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/auth/servicos/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAutenticado()) return true;

  router.navigate(['/login']);
  return false;
};
```

Guard de role:
```typescript
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.temPerfil('admin')) return true;

  router.navigate(['/sem-permissao']);
  return false;
};
```

## Navegação Programática

```typescript
// Absoluta
this.router.navigate(['/produtos']);
this.router.navigate(['/produtos', produto.Id, 'edicao']);

// Relativa (dentro do módulo atual)
this.router.navigate(['..'], { relativeTo: this.route });          // voltar para listagem
this.router.navigate(['..', 'edicao'], { relativeTo: this.route }); // de detalhe → edicao

// Com query params
this.router.navigate(['/produtos'], {
  queryParams: { pagina: 2, filtro: 'caderno' }
});
```

## Exemplos ERP Completos

```
/dashboard
/produtos
/produtos/cadastro
/produtos/123
/produtos/123/edicao
/produtos/123/imagens
/fornecedores
/fornecedores/cadastro
/fornecedores/456/edicao
/fornecedores/456/contatos/cadastro
/cotacoes
/cotacoes/nova
/cotacoes/789/itens
/cotacoes/relatorio-de-economia
/clientes/relatorio-de-pedidos-por-periodo
```

## Checklist — Novo Módulo com Rotas

- [ ] Criar `app/{modulo}/{modulo}.routes.ts`
- [ ] Rotas fixas (`cadastro`, sub-contextos) declaradas **antes** de `:id`
- [ ] `loadComponent` em todas as rotas (lazy loading)
- [ ] `title` em cada rota (exibido na aba do browser)
- [ ] Registrar em `app.routes.ts` com `loadChildren`
- [ ] Guard `canActivate` se rota protegida
- [ ] Testar navegação relativa (`..`) em detalhe/edição
