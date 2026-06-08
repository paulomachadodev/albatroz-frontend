# ADR-0003 — PrimeNG Unstyled para componentes complexos

**Status:** Aceito  
**Data:** 2026-06-01  
**Número:** 0003

---

## Contexto

Componentes como tabelas com ordenação/paginação, modais, selects com busca, date pickers e overlays têm comportamento complexo de acessibilidade e interação que é custoso de reimplementar do zero. Ao mesmo tempo, o DS Albatroz exige controle total sobre a aparência visual — frameworks com tema embutido (Material, PrimeNG Lara) colidem com Tailwind e geram conflitos de estilo.

---

## Decisão

Adotamos **PrimeNG no modo unstyled** para componentes de comportamento complexo.

PrimeNG unstyled fornece o comportamento (acessibilidade, teclado, overlay, portal) sem impor nenhuma classe CSS de tema. O estilo 100% fica com Tailwind + tokens DS Albatroz via `pt` (PassThrough) API do PrimeNG.

Componentes PrimeNG usados principalmente: `p-dialog`, `p-table`, `p-select`, `p-datepicker`, `p-toast`, `p-confirmdialog`.

---

## Alternativas Consideradas

| Alternativa | Por que descartada |
|-------------|-------------------|
| PrimeNG com tema Lara/Aura | Tema embutido conflita com Tailwind; `!important` em cascata para sobrescrever |
| Angular CDK puro | Mais baixo nível; cada componente exigiria implementação completa de acessibilidade |
| ngx-bootstrap | Acoplado ao Bootstrap; incompatível com Tailwind-first |
| Componentes 100% custom | Custo alto para reimplementar table, modal, overlay com acessibilidade correta |

---

## Consequências

**Positivas:**
- Comportamento acessível (ARIA, teclado) sem custo de implementação.
- Estilo 100% controlado via Tailwind — sem conflito com DS Albatroz.
- PassThrough API permite injetar classes por slot de template (`root`, `header`, `body`, etc.).

**Negativas / Trade-offs:**
- PassThrough API tem curva de aprendizado — necessário consultar docs por componente.
- Atualizações de PrimeNG podem mudar nomes de slots — testar em upgrades.
- Alguns componentes PrimeNG têm comportamento de z-index/portal que requer ajuste com Tailwind.

**Ações decorrentes:**
- Toda configuração de estilo de componentes PrimeNG via `pt` (PassThrough) — nunca sobrescrever via CSS global com `!important`.
