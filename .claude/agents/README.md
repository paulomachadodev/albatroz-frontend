# Agents

Subagentes especializados do Claude Code. Cada arquivo define `name`, `description` e `model` no frontmatter YAML.

| Agent | Modelo | Quando usar |
|---|---|---|
| `frontend-architect` | opus | Decisões arquiteturais Angular, estrutura de contextos, routing, trade-offs, qualquer pergunta "como estruturar" |
| `angular-engineer` | sonnet | Implementação de componentes, páginas, serviços, signals, requests, responses, rotas |
| `ds-engineer` | sonnet | Design System Albatroz: tokens, cards, tabelas, forms, layout, AI insight, criação de telas |

## Regra de modelo

- **opus** — arquitetura e decisões com trade-offs (só `frontend-architect`)
- **sonnet** — implementação, escrita de código, specs, conteúdo técnico (todos os outros)
- **haiku** — tarefas mecânicas (criar pastas/arquivos, scaffolding); agents delegam via Agent tool quando apropriado
