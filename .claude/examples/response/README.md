# Exemplo — Model de Resposta

Exemplo canônico de model de resposta — interface TypeScript com campos do backend.

**Fonte:** `src/app/contextos/financeiro/cartoes/models/cartao.model.ts`

```typescript
export interface Cartao {
  id: number;
  empresaId: number;
  idCartaoPrincipal?: number | null;
  idContatoPortador?: number;
  portadorNome?: string;
  ultimos4Digitos: string;
  apelido: string;
  bandeira?: string;
  diaVencimento: number;
  diaFechamento: number;
  limiteTotal: number;
  limiteUsado: number;
  limiteDisponivel: number;
  ativo: number;
  criadoEm: string;
  ehAdicional?: boolean;
  adicionais?: Cartao[];  // nesting recursivo
}
```

**Padrões ilustrados:**

- Arquivo: `{entidade}.model.ts` — kebab-case com sufixo `.model.ts`
- Pasta: `models/` dentro do contexto
- Interface pura — sem class, sem decorators
- `empresaId` sempre presente — multi-tenant garantido
- `criadoEm: string` — datas como string ISO, parse no template ou pipe
- Nesting recursivo (`adicionais?: Cartao[]`) — reflete estrutura do backend
- `ativo: number` não `boolean` — espelha `NUMERIC(1)` do banco

**Diferença request vs. model:**

| `*Requisicao` (input) | `*.model` (output) |
|---|---|
| Pasta `dtos/` | Pasta `models/` |
| Campos que o usuário envia | Campos que o backend retorna |
| Omite `id`, `empresaId`, campos calculados | Inclui `id`, `empresaId`, timestamps, campos calculados |
