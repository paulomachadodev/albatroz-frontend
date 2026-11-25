---
name: angular-responses
description: Padrão de Response interfaces em Angular. Nomenclatura, PascalCase, objetos aninhados, organização de pastas.
---

# Angular Responses — Padrão Albatroz

## Regras

1. **Sufixo `Response`** — `UsuarioResponse`, `ProdutoResponse`, `EnderecoResponse`
2. **Sempre `interface`** — nunca `class` ou `type`
3. **PascalCase** — todas as propriedades: `NomeCompleto`, `DataNascimento`, `Ativo`
4. **Sem JSDoc** — nome já descreve
5. **Objeto complexo → interface separada** — nunca inline
6. **`export` obrigatório** — todas as interfaces exportadas
7. **Pasta:** `app/{contexto}/models/responses/`

## Padrão Básico

```typescript
// app/usuarios/models/responses/usuario.response.ts
export interface UsuarioResponse {
  Id: number;
  Nome: string;
  Email: string;
  Telefone?: string;
  Ativo: boolean;
  DataCriacao: string;
}
```

## Objeto Complexo — Interface Separada

Quando uma propriedade é um objeto complexo, criar interface própria:

```typescript
// app/usuarios/models/responses/endereco.response.ts
export interface EnderecoResponse {
  Rua: string;
  Numero: string;
  Complemento?: string;
  Cidade: string;
  Uf: string;
  Cep: string;
}

// app/usuarios/models/responses/contato.response.ts
export interface ContatoResponse {
  Tipo: string;
  Valor: string;
}

// app/usuarios/models/responses/usuario.response.ts
export interface UsuarioResponse {
  Id: number;
  Nome: string;
  Email: string;
  Endereco: EnderecoResponse;       // ← interface separada
  Contatos: ContatoResponse[];      // ← lista de interface separada
  DataCriacao: string;
}
```

## Resposta Paginada

```typescript
// app/shared/models/responses/paginacao.response.ts
export interface PaginacaoResponse<T> {
  Total?: number;
  Registros?: T[];
  Pagina?: number;
  TamanhoPagina?: number;
}

// Uso:
// Observable<PaginacaoResponse<ProdutoResponse>>
```

## Estrutura de Pastas

```
app/produtos/
└── models/
    └── responses/
        ├── produto.response.ts
        ├── produto-detalhe.response.ts    ← variante com campos extras
        └── categoria.response.ts          ← objeto complexo separado

app/usuarios/
└── models/
    └── responses/
        ├── usuario.response.ts
        ├── endereco.response.ts
        └── contato.response.ts
```

## Nomes de Arquivo

`{entidade}.response.ts` — kebab-case, singular:

| Interface | Arquivo |
|-----------|---------|
| `ProdutoResponse` | `produto.response.ts` |
| `EnderecoResponse` | `endereco.response.ts` |
| `ProdutoDetalheResponse` | `produto-detalhe.response.ts` |

## Variantes de Response

Quando a API retorna formatos diferentes (listagem vs detalhe), criar interfaces distintas:

```typescript
// Listagem — campos resumidos
export interface ProdutoResponse {
  Id: number;
  Nome: string;
  Preco: number;
  Ativo: boolean;
}

// Detalhe — campos completos
export interface ProdutoDetalheResponse {
  Id: number;
  Nome: string;
  Descricao: string;
  Preco: number;
  Estoque: number;
  Categoria: CategoriaResponse;
  Imagens: ImagemResponse[];
  Ativo: boolean;
  DataCriacao: string;
  DataAtualizacao?: string;
}
```

## ❌ Errado

```typescript
// ❌ class em vez de interface
export class UsuarioResponse {
  Id: number = 0;
  Nome: string = '';
}

// ❌ camelCase nas propriedades
export interface UsuarioResponse {
  id: number;
  nomeCompleto: string;  // ← ERRADO, deve ser NomeCompleto
}

// ❌ objeto complexo inline
export interface UsuarioResponse {
  Id: number;
  Endereco: {            // ← ERRADO, deve ser EnderecoResponse
    Rua: string;
    Cidade: string;
  };
}

// ❌ JSDoc
export interface UsuarioResponse {
  /** Identificador único do usuário */  // ← ERRADO
  Id: number;
}
```
