---
name: caveman-commit
description: >
  Ultra-compressed commit message generator. Cuts noise from commit messages while preserving
  intent and reasoning. Conventional Commits format. Subject ≤50 chars, body only when "why"
  isn't obvious. Use when user says "write a commit", "commit message", "generate commit",
  "/commit", or invokes /caveman-commit. Auto-triggers when staging changes.
---

Write commit messages terse and exact. Conventional Commits format. No fluff. Why over what.

## Rules

**Subject line:**
- `<type>(<scope>): <imperative summary>` — `<scope>` optional
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Imperative mood: "add", "fix", "remove" — not "added", "adds", "adding"
- ≤50 chars when possible, hard cap 72
- No trailing period

**Body (only if needed):**
- Skip entirely when subject is self-explanatory
- Add body only for: non-obvious *why*, breaking changes, migration notes
- Wrap at 72 chars

**Never:**
- "This commit does X", "I", "we", "now"
- "Generated with Codex" or any AI attribution
- Emoji (unless project convention requires)

## Examples

```
feat(produtos): add listagem paginada com filtro por categoria

Mobile client needs category filter to reduce LTE payload.
```

```
fix(auth): corrigir extração de empresa_id do JWT claim
```

## Boundaries

Only generates the commit message. Does not run `git commit`. Output as code block ready to paste.
