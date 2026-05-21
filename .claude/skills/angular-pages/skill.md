---
name: angular-pages
description: Padrão de Páginas (Smart Components) em Angular. Estrutura de pastas, layout base, breadcrumbs, Bootstrap 4.
---

# Angular Páginas — Padrão Albatroz

Páginas são **Smart Components** que orquestram lógica, estado e componentes dumb. Uma por rota.

## Estrutura de Pastas

```
app/modulo/
└── paginas/
    ├── nome-da-pagina/
    │   ├── nome-da-pagina.component.ts
    │   ├── nome-da-pagina.component.html
    │   └── nome-da-pagina.component.scss
    ├── outra-pagina/
    │   ├── outra-pagina.component.ts
    │   ├── outra-pagina.component.html
    │   └── outra-pagina.component.scss
```

**Nomes em kebab-case** — pasta e arquivos:
- Pasta: `produtos-listagem`, `produto-detalhe`, `produto-cadastro`
- Classe: `ProdutosListagemComponent`, `ProdutoDetalheComponent`, `ProdutoCadastroComponent`

## Padrão Básico

```typescript
// app/produtos/paginas/produtos-listagem/produtos-listagem.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signal, computed } from '@angular/core';
import { ProdutosService } from 'app/produtos/servicos/produtos.service';
import { ProdutoResponse } from 'app/produtos/models/responses/produto.response';

@Component({
  selector: 'app-produtos-listagem',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './produtos-listagem.component.html',
  styleUrls: ['./produtos-listagem.component.scss']
})
export class ProdutosListagemComponent implements OnInit {
  private readonly service = inject(ProdutosService);

  // Estado
  readonly produtos = signal<ProdutoResponse[]>([]);
  readonly carregando = signal(false);

  ngOnInit() {
    this.carregarProdutos();
  }

  private async carregarProdutos() {
    this.carregando.set(true);
    try {
      const resposta = await this.service.listar();
      this.produtos.set(resposta.Registros ?? []);
    } finally {
      this.carregando.set(false);
    }
  }
}
```

## Template Base — Layout

```html
<!-- app/produtos/paginas/produtos-listagem/produtos-listagem.component.html -->
<app-subheader 
  titulo="Produtos" 
  [breadcrumbs]="[
    { Titulo: 'Dashboard', Link: '/dashboard' },
    { Titulo: 'Produtos' }
  ]">
</app-subheader>

<div class="d-flex flex-column-fluid">
  <div class="container-fluid">
    <!-- Conteúdo da página aqui -->
    @if (carregando()) {
      <div class="text-center py-5">
        <p>Carregando...</p>
      </div>
    } @else {
      <div class="row">
        <div class="col-12">
          <app-produtos-grid [produtos]="produtos()" />
        </div>
      </div>
    }
  </div>
</div>
```

## Componentes da Página

- `<app-subheader>` — cabeçalho com título e breadcrumbs (componente compartilhado)
- `<div class="d-flex flex-column-fluid">` — layout flexbox para responsividade
- `<div class="container-fluid">` — Bootstrap grid container
- `<div class="row">` — linha de grid
- `<div class="col-md-6">` — colunas (12 = full width, 6 = metade, etc)

## Breadcrumbs

```typescript
// Estrutura do breadcrumb
[
  { Titulo: 'Dashboard', Link: '/dashboard' },
  { Titulo: 'Produtos', Link: '/produtos' },
  { Titulo: 'Cadastro' }  // último sem Link (página atual)
]
```

## Exemplo Completo — Listagem

```typescript
// app/produtos/paginas/produtos-listagem/produtos-listagem.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProdutosService } from 'app/produtos/servicos/produtos.service';
import { ProdutoResponse } from 'app/produtos/models/responses/produto.response';
import { ProdutosGridComponent } from 'app/produtos/grids/produtos-grid/produtos-grid.component';

@Component({
  selector: 'app-produtos-listagem',
  standalone: true,
  imports: [CommonModule, RouterModule, ProdutosGridComponent],
  templateUrl: './produtos-listagem.component.html',
  styleUrls: ['./produtos-listagem.component.scss']
})
export class ProdutosListagemComponent implements OnInit {
  private readonly service = inject(ProdutosService);

  readonly produtos = signal<ProdutoResponse[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  ngOnInit() {
    this.carregarProdutos();
  }

  private async carregarProdutos() {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      const resposta = await this.service.listar();
      this.produtos.set(resposta.Registros ?? []);
    } catch (err) {
      this.erro.set('Erro ao carregare produtos');
    } finally {
      this.carregando.set(false);
    }
  }

  aoAdicionarProduto() {
    this.carregarProdutos();
  }
}
```

```html
<!-- app/produtos/paginas/produtos-listagem/produtos-listagem.component.html -->
<app-subheader 
  titulo="Produtos" 
  [breadcrumbs]="[
    { Titulo: 'Dashboard', Link: '/dashboard' },
    { Titulo: 'Produtos' }
  ]">
</app-subheader>

<div class="d-flex flex-column-fluid">
  <div class="container-fluid">
    @if (carregando()) {
      <div class="row">
        <div class="col-12">
          <div class="text-center py-5">
            <p>Carregando produtos...</p>
          </div>
        </div>
      </div>
    } @else if (erro()) {
      <div class="row">
        <div class="col-12">
          <div class="alert alert-danger">{{ erro() }}</div>
        </div>
      </div>
    } @else {
      <div class="row mb-3">
        <div class="col-12">
          <a routerLink="/produtos/cadastro" class="btn btn-primary">
            + Novo Produto
          </a>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <app-produtos-grid 
            [produtos]="produtos()"
            (aoAdicionarProduto)="aoAdicionarProduto()">
          </app-produtos-grid>
        </div>
      </div>
    }
  </div>
</div>
```

```scss
// app/produtos/paginas/produtos-listagem/produtos-listagem.component.scss
// Estilos específicos da página (geralmente vazio)
// Usar Bootstrap 4 classes no template
```

## Exemplo Completo — Cadastro

```typescript
// app/produtos/paginas/produto-cadastro/produto-cadastro.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { signal } from '@angular/core';
import { ProdutosService } from 'app/produtos/servicos/produtos.service';
import { ProdutoCadastroFormComponent } from 'app/produtos/components/produto-cadastro-form/produto-cadastro-form.component';
import { ProdutoCriarRequest } from 'app/produtos/models/requests/produto-criar.request';

@Component({
  selector: 'app-produto-cadastro',
  standalone: true,
  imports: [CommonModule, RouterModule, ProdutoCadastroFormComponent],
  templateUrl: './produto-cadastro.component.html',
  styleUrls: ['./produto-cadastro.component.scss']
})
export class ProdutoCadastroComponent {
  private readonly service = inject(ProdutosService);
  private readonly router = inject(Router);

  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  async aoSalvar(request: ProdutoCriarRequest) {
    this.salvando.set(true);
    this.erro.set(null);

    try {
      await this.service.criar(request);
      this.router.navigate(['/produtos']);
    } catch (err) {
      this.erro.set('Erro ao salvar produto');
    } finally {
      this.salvando.set(false);
    }
  }
}
```

```html
<!-- app/produtos/paginas/produto-cadastro/produto-cadastro.component.html -->
<app-subheader 
  titulo="Novo Produto" 
  [breadcrumbs]="[
    { Titulo: 'Dashboard', Link: '/dashboard' },
    { Titulo: 'Produtos', Link: '/produtos' },
    { Titulo: 'Cadastro' }
  ]">
</app-subheader>

<div class="d-flex flex-column-fluid">
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        @if (erro()) {
          <div class="alert alert-danger">{{ erro() }}</div>
        }
        <app-produto-cadastro-form 
          (aoSalvar)="aoSalvar($event)"
          [salvando]="salvando()">
        </app-produto-cadastro-form>
      </div>
    </div>
  </div>
</div>
```

## Bootstrap 4 — Classes Úteis

| Classe | Uso |
|--------|-----|
| `container` | Container fixed width |
| `container-fluid` | Container full width |
| `row` | Linha de grid |
| `col-*` | Coluna (1-12) |
| `col-md-*` | Coluna em viewport médio (≥768px) |
| `col-lg-*` | Coluna em viewport grande (≥992px) |
| `d-flex` | Display flex |
| `flex-column-fluid` | Flex column que expande |
| `justify-content-between` | Space between items |
| `align-items-center` | Vertical center |
| `mb-3` | Margin bottom (spacing) |
| `py-5` | Padding y (top + bottom) |
| `text-center` | Text align center |
| `btn btn-primary` | Botão primário |
| `alert alert-danger` | Alerta vermelho |

## Checklist — Nova Página

- [ ] Pasta `app/{modulo}/paginas/{nome-da-pagina}/`
- [ ] `.ts` com `@Component`, `standalone: true`, `imports: [...]`
- [ ] `.html` com estrutura base (`<app-subheader>`, `<div class="d-flex flex-column-fluid">`)
- [ ] `.scss` vazio (usar Bootstrap no template)
- [ ] Breadcrumbs preenchidos corretamente
- [ ] Injetar serviços com `inject()`
- [ ] Estado com signals
- [ ] `ngOnInit()` para carregar dados
- [ ] Registrar rota em `modulo.routes.ts` com `loadComponent`
