---
name: angular-requests
description: Padrão de Request classes em Angular. Nomenclatura, PascalCase, constructor obrigatório, objetos aninhados, organização de pastas.
---

# Angular Requests — Padrão Albatroz

## Regras

1. **Sufixo `Request`** — `UsuarioCriarRequest`, `ProdutoAtualizarRequest`
2. **Sempre `class`** — nunca `interface` ou `type`
3. **PascalCase** — todas as propriedades: `NomeCompleto`, `DataNascimento`
4. **Constructor obrigatório** — recebe `params` do próprio tipo, atribui cada propriedade
5. **Opcional com `?? null`** — nunca `undefined` em propriedades opcionais
6. **Objeto complexo → classe separada** — nunca inline
7. **Sem JSDoc** — nome já descreve
8. **`export` obrigatório** em todas as classes
9. **Pasta:** `app/{contexto}/models/requests/`

## Padrão Básico

```typescript
// app/usuarios/models/requests/usuario-criar.request.ts
export class UsuarioCriarRequest {
  Nome: string;
  Email: string;
  Perfil: string;
  Telefone?: string | null;

  constructor(params: UsuarioCriarRequest) {
    this.Nome = params.Nome;
    this.Email = params.Email;
    this.Perfil = params.Perfil;
    this.Telefone = params.Telefone ?? null;
  }
}
```

## Request de Atualização

```typescript
// app/usuarios/models/requests/usuario-atualizar.request.ts
export class UsuarioAtualizarRequest {
  Nome: string;
  Email: string;
  Telefone?: string | null;
  DataNascimento?: string | null;

  constructor(params: UsuarioAtualizarRequest) {
    this.Nome = params.Nome;
    this.Email = params.Email;
    this.Telefone = params.Telefone ?? null;
    this.DataNascimento = params.DataNascimento ?? null;
  }
}
```

## Objeto Complexo — Classe Separada

Quando uma propriedade é um objeto complexo, criar classe própria:

```typescript
// app/usuarios/models/requests/endereco.request.ts
export class EnderecoRequest {
  Rua: string;
  Numero: string;
  Complemento?: string | null;
  Cidade: string;
  Uf: string;
  Cep: string;

  constructor(params: EnderecoRequest) {
    this.Rua = params.Rua;
    this.Numero = params.Numero;
    this.Complemento = params.Complemento ?? null;
    this.Cidade = params.Cidade;
    this.Uf = params.Uf;
    this.Cep = params.Cep;
  }
}

// app/usuarios/models/requests/usuario-criar.request.ts
export class UsuarioCriarRequest {
  Nome: string;
  Email: string;
  Endereco: EnderecoRequest;    // ← classe separada

  constructor(params: UsuarioCriarRequest) {
    this.Nome = params.Nome;
    this.Email = params.Email;
    this.Endereco = params.Endereco;
  }
}
```

## Request Paginada

Listagens que precisam de paginação estendem `PaginacaoRequest`:

```typescript
// app/shared/models/requests/paginacao.request.ts
export class PaginacaoRequest {
  Pg?: number;
  Qt?: number;
  TpOrd?: string;
  CpOrd?: string;

  constructor(params: Partial<PaginacaoRequest> = {}) {
    this.Pg = params.Pg ?? 1;
    this.Qt = params.Qt ?? 20;
    this.TpOrd = params.TpOrd;
    this.CpOrd = params.CpOrd;
  }
}
```

Estender em requests paginadas:

```typescript
// app/produtos/models/requests/produtos-listar.request.ts
import { PaginacaoRequest } from 'app/shared/models/requests/paginacao.request';

export class ProdutosListarRequest extends PaginacaoRequest {
  Categoria?: string | null;
  Ativo?: boolean | null;

  constructor(params: Partial<ProdutosListarRequest> = {}) {
    super(params);
    this.Categoria = params.Categoria ?? null;
    this.Ativo = params.Ativo ?? null;
  }
}

// Uso:
const request = new ProdutosListarRequest({
  Pg: 1,
  Qt: 20,
  TpOrd: 'Nome',
  CpOrd: 'ASC',
  Categoria: 'escolar'
});
```

Campos de `PaginacaoRequest`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Pg` | `number` | Página (default 1) |
| `Qt` | `number` | Itens por página (max 100, default 20) |
| `TpOrd` | `string` | Coluna para ordenação |
| `CpOrd` | `string` | Direção: `ASC` ou `DESC` |

> **Quando o Design System estiver disponível:** Substituir `app/shared/models/requests/paginacao.request.ts` por import de `@ds/utils` e remover o arquivo local.

## Estrutura de Pastas

```
app/produtos/
└── models/
    └── requests/
        ├── produtos-listar.request.ts
        ├── produto-criar.request.ts
        ├── produto-atualizar.request.ts
        └── dimensoes.request.ts          ← objeto complexo separado

app/usuarios/
└── models/
    └── requests/
        ├── usuarios-listar.request.ts
        ├── usuario-criar.request.ts
        ├── usuario-atualizar.request.ts
        └── endereco.request.ts
```

## Nomes de Arquivo

`{entidade}-{acao}.request.ts` — kebab-case, singular:

| Classe | Arquivo |
|--------|---------|
| `ProdutoCriarRequest` | `produto-criar.request.ts` |
| `ProdutoAtualizarRequest` | `produto-atualizar.request.ts` |
| `ProdutosListarRequest` | `produtos-listar.request.ts` |
| `EnderecoRequest` | `endereco.request.ts` |

## ❌ Errado

```typescript
// ❌ interface em vez de class
export interface UsuarioCriarRequest {
  Nome: string;
}

// ❌ camelCase nas propriedades
export class UsuarioCriarRequest {
  nome: string;           // ← ERRADO, deve ser Nome
  emailUsuario: string;   // ← ERRADO, deve ser EmailUsuario

  constructor(params: UsuarioCriarRequest) {
    this.nome = params.nome;
  }
}

// ❌ sem constructor
export class UsuarioCriarRequest {
  Nome: string = '';      // ← ERRADO, deve ter constructor com params
  Email: string = '';
}

// ❌ objeto complexo inline
export class UsuarioCriarRequest {
  Nome: string;
  Endereco: {             // ← ERRADO, deve ser EnderecoRequest
    Rua: string;
    Cidade: string;
  };

  constructor(params: UsuarioCriarRequest) { ... }
}

// ❌ JSDoc
export class UsuarioCriarRequest {
  /** Nome completo do usuário */  // ← ERRADO
  Nome: string;
}
```
