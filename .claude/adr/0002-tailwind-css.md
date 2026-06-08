# ADR-0002 — Tailwind CSS como solução de estilo

**Status:** Aceito  
**Data:** 2026-06-01  
**Número:** 0002

---

## Contexto

O ERP precisava de uma estratégia de estilo que permitisse construir um Design System proprietário (DS Albatroz) com tokens visuais consistentes, sem o peso de um framework de componentes com estilos opinativos. A combinação com PrimeNG unstyled (ADR-0003) exigia uma solução de estilo que pudesse estilizar componentes externos arbitrários via classes utilitárias.

---

## Decisão

Adotamos **Tailwind CSS** como solução de estilo primária.

O Design System Albatroz é construído sobre tokens Tailwind customizados (cores, espaçamentos, tipografia, radius) definidos em `tailwind.config`. Componentes usam classes utilitárias diretamente nos templates — sem arquivos `.scss` por componente, exceto quando necessário para animações ou pseudo-seletores complexos.

---

## Alternativas Consideradas

| Alternativa | Por que descartada |
|-------------|-------------------|
| Bootstrap 4/5 | Estilos opinativos conflitam com DS próprio; difícil customizar sem `!important` em cascata |
| CSS Modules + SCSS puro | Mais verboso; sem sistema de tokens nativo; difícil garantir consistência em equipe |
| Angular Material | Design System próprio (Material) conflita com identidade visual Albatroz |
| Styled Components | Não é idiomático em Angular; overhead de runtime |

---

## Consequências

**Positivas:**
- Tokens centralizados em `tailwind.config` são a fonte da verdade de cores/espaçamentos.
- Classes utilitárias no template tornam o estilo visível sem alternar de arquivo.
- PurgeCSS automático no build produção → CSS final mínimo.
- Dark mode via `dark:` prefix nativo no Tailwind.

**Negativas / Trade-offs:**
- Templates podem ficar verbosos com muitas classes utilitárias — necessário discipline de extração para componentes.
- Desenvolvedores sem experiência Tailwind têm curva inicial de aprendizado.

**Ações decorrentes:**
- Tokens DS Albatroz definidos em `tailwind.config` (cores `ds-*`, radius, fontes).
- Skills `ds-tokens`, `ds-cards`, `ds-layout`, etc. documentam os padrões de uso.
