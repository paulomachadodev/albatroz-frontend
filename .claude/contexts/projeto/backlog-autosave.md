# Backlog: migrar autosave → botão Salvar explícito

Decisão de 2026-07-31 (ver `@standards/angular/listagem-padrao.md`): CRUDs novos/tocados usam botão Salvar explícito, não autosave por campo. Não foi feita uma varredura completa do repo trocando telas antigas — só as telas do escopo daquele pedido (Cadastro de Escolas, Lista Escolar) migraram.

**Pendente:** mapear todas as telas CRUD que ainda usam o padrão antigo de autosave (`setTimeout`/`clearTimeout` disparando `PATCH` por campo) e migrar pra Salvar explícito.

**Como achar candidatas:** grep por `setTimeout` + chamada de `.service.atualizar(`/`.criar(` no mesmo bloco, em `src/app/contextos/**/*.component.ts`.
