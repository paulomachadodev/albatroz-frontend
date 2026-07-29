# Timezone — Exibição em horário local (Brasília)

> Confirmado (2026-07-29, ver `albatroz-backend/.claude/standards/timezone-exibicao.md` pro lado backend): API sempre retorna data em UTC — conversão pra `America/Sao_Paulo` acontece só na exibição, nunca no dado.

## Regra

Todo `date` pipe que exibe timestamp vindo da API deve passar o timezone explícito como terceiro parâmetro:

```html
{{ item.data | date:'dd/MM/yyyy HH:mm':'America/Sao_Paulo' }}
```

Sem o terceiro parâmetro, o pipe usa o timezone do **browser do usuário** — diverge se alguém acessar de fuso diferente do Brasil. Sempre fixar `'America/Sao_Paulo'` explicitamente.

Já aplicado em: `listas-lista.component.html`, `atendimentos-dashboard.component.html`. Aplicar em qualquer tela nova que mostre timestamp.
