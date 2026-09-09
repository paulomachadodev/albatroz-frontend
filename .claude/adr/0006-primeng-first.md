# ADR-0006 — PrimeNG First: prioridade de componente e migração completa

**Status:** Aceito
**Data:** 2026-09-09
**Número:** 0006

---

## Contexto

O ADR-0003 já autorizava PrimeNG unstyled para componentes complexos (`p-dialog`, `p-table`, `p-select`, `p-datepicker`, `p-toast`, `p-confirmdialog`), mas na prática o time seguiu construindo componentes hand-rolled em Tailwind puro pra casos que o PrimeNG já cobre — `app-select-busca` (single-select com busca) e `app-toggle` (switch liga/desliga) são os dois exemplos vivos, usados em 13 e 19 arquivos respectivamente no ERP. Isso gerou base "misturada": parte da UI usa PrimeNG, parte reimplementa comportamento equivalente do zero, sem critério explícito de quando usar qual.

Gatilho concreto: filtro de Marca do Relatório de Compras precisava virar multi-seleção com busca e listagem completa de opções (469 marcas, 3908 fornecedores) — exatamente o caso que `p-multiSelect` (com `lazy` + `virtualScroll`) resolve de fábrica, e que `app-select-busca` não suporta sem reescrever a lógica de novo.

---

## Decisão

**PrimeNG é a primeira opção para qualquer componente de comportamento complexo, em ambos os projetos Angular do ecossistema (`albatroz-frontend` e `albatroz-site`).** Regra de prioridade:

1. **Existe componente PrimeNG pro caso?** Usa ele, sempre unstyled + Tailwind via PassThrough (`pt`), conforme ADR-0003 — nunca tema Lara/Aura.
2. **Não existe no PrimeNG?** Só então componente custom em Tailwind puro (mesmo padrão de sempre: tokens DS, dark mode via `.dark`).

Isso vale tanto para componente novo quanto pra decidir se um componente custom existente deve migrar. Consequência direta: os hand-rolled que hoje duplicam comportamento que o PrimeNG já tem entram em migração (ver spec `migracao-primeng.md`):

- `app-select-busca` → `p-select` (single) / `p-multiSelect` (multi), com `[lazy]="true" [virtualScroll]="true"` quando a fonte de dados for grande (fornecedor, produto).
- `app-toggle` → `p-toggleswitch`.
- Checkbox cru usado como "selecionar tudo"/liga-desliga de listagem (ex: header da tabela em `compras-lista`) → `p-toggleswitch` também, nunca `<input type="checkbox">` estilizado à mão. Essa regra já existia pra formulário (`app-toggle`, ver `listagem-padrao.md`) — passa a valer explicitamente pra controles de listagem/tabela também.
- Gráficos (`grafico-barras` e qualquer novo gráfico) seguem via componentes de chart do PrimeNG/Chart.js já integrado, mesma fonte, sem lib paralela.

`albatroz-site` segue o mesmo princípio (ADR próprio de paridade, `0003-parity-with-frontend.md`) — qualquer componente de busca/seleção/toggle novo no site nasce PrimeNG-first, mesma regra.

---

## Alternativas Consideradas

| Alternativa | Por que descartada |
|-------------|-------------------|
| Manter os dois padrões coexistindo (custom + PrimeNG) por tela/caso | É o estado atual — gera decisão ad-hoc a cada tela nova, inconsistência visual/comportamental (ex: `app-select-busca` sem paginação/virtual scroll vs. `p-select` com) |
| Migrar tudo de uma vez num PR único | Risco de regressão simultânea em 6+ telas sem cobertura de teste manual proporcional; decisão explícita do usuário (2026-09-09) de fazer por fases — ver spec |
| Abandonar PrimeNG, ir 100% custom | Reimplementar virtual scroll, lazy load, acessibilidade de overlay do zero — custo já rejeitado no ADR-0003 |

---

## Consequências

**Positivas:**
- 1 fonte de comportamento pra busca/seleção/toggle em todo o ecossistema — menos código pra manter, menos superfície de bug.
- Casos de volume grande (469 marcas, 3908 fornecedores) resolvidos com `lazy`+`virtualScroll` nativo, sem reinventar paginação client-side.

**Negativas / Trade-offs:**
- Período de transição com os dois padrões coexistindo até a migração completa (ver spec) — inevitável, migração é faseada por decisão do usuário.
- Curva de aprendizado do PassThrough API por componente novo (já apontada no ADR-0003).

**Ações decorrentes:**
- Spec `migracao-primeng.md` lista o escopo completo (13 arquivos `app-select-busca`, 19 arquivos `app-toggle`, gráficos, checkbox "selecionar tudo") e as fases de execução.
- `listagem-padrao.md` e `ds-forms/skill.md` atualizados com a regra de prioridade e os componentes de destino.
- Agentes `ds-engineer` e `angular-engineer` (ERP) e equivalentes do site atualizados pra aplicar a regra em qualquer código novo, mesmo antes da migração dos componentes antigos estar completa.
