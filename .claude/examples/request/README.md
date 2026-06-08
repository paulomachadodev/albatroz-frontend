# Exemplo — DTO de Entrada (Requisicao)

Exemplo canônico de DTO de entrada — interface TypeScript simples, sem decorators.

**Fonte:** `src/app/contextos/financeiro/cartoes/dtos/cartao-requisicao.dto.ts`

```typescript
export interface CartaoRequisicao {
  idCartaoPrincipal?: number | null;
  idContatoPortador?: number;
  ultimos4Digitos: string;
  apelido: string;
  bandeira?: string;
  diaVencimento: number;
  diaFechamento: number;
  limiteTotal: number;
}
```

**Padrões ilustrados:**

- Nome: `{Entidade}Requisicao` — sufixo `Requisicao`, PascalCase
- Arquivo: `{entidade}-requisicao.dto.ts` — kebab-case com sufixo `.dto.ts`
- Pasta: `dtos/` dentro do contexto
- Interface pura — sem class, sem decorators, sem validações
- Opcionais explícitos com `?` — nunca omitir `?` em campos que o backend aceita null/undefined
- `number | null` quando o backend aceita null explicitamente (vs. `?` que aceita undefined)
- Espelha exatamente o `*Requisicao.cs` do backend — mesmos campos, mesmos tipos equivalentes
