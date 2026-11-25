---
name: revisao-pre-commit
description: Checklist obrigatória antes de todo commit/push — regras hard do projeto que não dependem de julgamento (comentário em código é a primeira; a lista cresce aqui, não em memória). Use SEMPRE antes de "git commit" ou "git push" em qualquer arquivo de código.
---

# Revisão antes de commit/push

Checklist de regras hard do projeto — sem exceção, sem "mas nesse caso". Roda sempre antes de `git add`/`git commit`/`git push` em código (não markdown/docs). Novas regras hard entram aqui, não ficam só em AGENTS.md ou memória — essa skill é o ponto único de checagem mecânica.

## 1. Nenhum comentário em código

Regra hard (ver AGENTS.md): nenhum comentário em nenhum arquivo de código — nem `//`, nem `/* */`, nem JSDoc. Sem exceção.

**Como checar:**

1. `git diff --cached` (se já deu `git add`) ou `git diff`, olhando as linhas adicionadas (`+`).
2. Por arquivo de código tocado (`.ts`, `.html` com lógica inline — não `.md`), procurar `//` (fora de string/URL), `/* ... */`, `/** ... */`.
3. Achou: remover antes de commitar — regra já autorizada. Se carregava um "why" real, renomear identificador ou extrair método.
4. Repetir até não sobrar nenhum.
5. Se o arquivo tocado já tinha comentário pré-existente (não só nas linhas novas), remover também.

**Não conta como comentário:** string literal com `//`/`/*` dentro (regex, template, URL).

## 2. empresa_id presente em todas as chamadas HTTP

Toda chamada de API deve incluir `empresa_id` via `TenantService`. Nunca hardcodar empresa.

**Como checar (diff que toca services ou HTTP):**
1. Procurar `apiService.get`/`post`/`put`/`delete` sem `{ params: { empresa_id: ... } }` ou `TenantService`.
2. Achou: injetar `TenantService` e passar `empresaId` nos params.

## 3. Nenhum `@Input()` / `@Output()` decorator

Regra hard: Angular 19 usa `input()`/`output()` signals. `@Input`/`@Output` são padrão antigo.

**Como checar:**
1. Procurar `@Input(` ou `@Output(` nas linhas adicionadas.
2. Achou: converter para `input<T>()` / `output<void>()` signals.

## (espaço para próximas regras)

Quando o usuário pedir uma nova regra hard de commit/push, adicionar como seção nova aqui.
