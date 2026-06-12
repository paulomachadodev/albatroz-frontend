# Specs — Albatroz Frontend

Especificações funcionais de UI. Cada spec descreve UMA tela ou fluxo de usuário.

## Ciclo de vida (SDD — Specification-Driven Development)

```
rascunho → aprovado → implementado → obsoleto
```

| Status | Significado |
|--------|-------------|
| `rascunho` | Em elaboração, ainda não validado |
| `aprovado` | Validado — pode ser implementado |
| `implementado` | Tela em produção |
| `obsoleto` | Substituído ou descontinuado |

## Regras

1. **Spec antes de código** — nenhuma tela/feature implementada sem spec `aprovado`
2. **Spec muda primeiro** — se UX muda durante implementação, atualizar spec antes de alterar código
3. **PR referencia spec** — todo PR de feature inclui path da spec
4. **Status sempre atualizado** — ao fazer merge, mudar para `implementado`

## Specs existentes

| Spec | Status | Descrição |
|------|--------|-----------|
| cartoes-financeiro.md | aprovado | Dashboard cartões, KPIs, faturas |
| extracao-fatura.md | aprovado | Upload PDF, polling async, revisão despesas |
