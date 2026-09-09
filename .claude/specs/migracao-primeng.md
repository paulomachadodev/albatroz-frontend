# Migração PrimeNG — select/multiselect/toggle/checkbox/gráficos

> Status: rascunho (aguardando autorização de execução — ver ADR-0006)
> Domínio: transversal (Compras, Produtos, Cotação/Listas Escolares, Cadastros)
> Última revisão: 2026-09-09

---

## Problema

Regra fixada em [[ADR-0006]]: PrimeNG é a primeira opção pra componente de comportamento complexo, em `albatroz-frontend` e `albatroz-site`. Hoje a base tem dois padrões coexistindo pro mesmo comportamento — `app-select-busca` (single-select com busca) e `app-toggle` (switch liga/desliga) foram construídos em Tailwind puro quando o PrimeNG já cobre os dois casos (`p-select`/`p-multiSelect`, `p-toggleswitch`). O gatilho concreto foi o filtro de Marca do Relatório de Compras precisar de multi-seleção com 469 opções e busca — caso que `app-select-busca` não suporta sem reescrever a lógica de novo, mas que `p-multiSelect` com `lazy`+`virtualScroll` resolve nativamente.

Sem essa migração, cada tela nova decide de novo se usa PrimeNG ou custom, e o comportamento (paginação, acessibilidade, virtual scroll) fica inconsistente entre telas que fazem a mesma coisa.

---

## Objetivo

Unificar toda busca com seleção (single/multi), todo liga-desliga binário e todo gráfico em PrimeNG unstyled + Tailwind (PassThrough), nos dois projetos Angular do ecossistema. Critério de sucesso: nenhum arquivo novo referencia `app-select-busca`/`app-toggle` depois da migração completa; os hand-rolled ficam obsoletos e são removidos ao final.

---

## Escopo — `albatroz-frontend` (ERP)

### Fase 1 — já autorizada (Relatório de Compras, ver conversa 2026-09-09)
- `compras-lista`: marca → `p-multiSelect` (multi, lazy+virtualScroll); fornecedor → `p-select` (single, lazy+virtualScroll); "Total estimado" reposicionado no card de filtros.
- Backend: `SugestaoCompraFiltro.IdMarca` → `IdsMarca: List<long>?`; `ListarSugestoesCompraConsulta` usa `id_marca = ANY(@IdsMarca)`.
- Endpoints reaproveitados (sem endpoint novo): `/v1/marcas` (`MarcaFiltro{texto}` paginado) e `/v1/contatos` (`ContatoFiltro{texto, tipo:'Fornecedor'}` paginado) no lugar de `/busca` (que trava em `LIMIT 20`).

### Fase 2 — `app-select-busca` → `p-select`/`p-multiSelect` (demais 12 arquivos)
| Tela | Arquivo | Uso atual | Observação |
|------|---------|-----------|------------|
| Produtos — detalhe | `produtos-detalhe.component.{ts,html}` | seleção de marca/fornecedor do produto | single-select |
| Produtos — lista | `produtos-lista.component.{ts,html}` | filtro marca/fornecedor | ver achado de `estadoLista` em `listagem-padrao.md` — guardar opção completa, não só id, ao restaurar |
| Listas Escolares — lista | `listas-lista.component.{ts,html}` | filtro escola/série | ver padrão "Filtros populados" em `listagem-padrao.md` |
| Listas Escolares — detalhe | `lista-detalhe.component.{ts,html}` | vínculo de escola/série no registro | |
| Séries — lista | `series-lista.component.{ts,html}` | filtro | |

Cada item: trocar template, mapear `buscar: (termo) => Observable<OpcaoSelectBusca[]>` pro `[options]`/`(onFilter)`/`(onLazyLoad)` do PrimeNG, decidir single vs. multi caso a caso (hoje todos são single — manter single a menos que o negócio peça o contrário, como aconteceu com Marca em Compras).

### Fase 3 — `app-toggle` → `p-toggleswitch` (19 arquivos)
Lista completa de arquivos afetados (grep `app-toggle`/`ToggleComponent` em 2026-09-09):
`marcas-lista`, `produtos-detalhe`, `produtos-importar-imagens`, `colunas-configuraveis`, `escolas-lista`, `series-lista`, `empresas-lista`, `contatos-lista`, `contatos-detalhe`.

Componente `shared/components/toggle/` some ao final — trocar por wrapper fino (se necessário manter API `[valor]/[label]/[desabilitado]/(valorMudou)`) em cima de `p-toggleswitch`, ou uso direto do `p-toggleswitch` em cada tela. Decisão de manter wrapper vs. uso direto: avaliar na execução, não bloqueia o planejamento.

**Regra nova, explícita (2026-09-09):** qualquer controle de "selecionar tudo"/"habilitar todos" em cabeçalho de listagem/tabela (ex: checkbox de header em `compras-lista` que hoje é `<input type="checkbox">` cru) também migra pra `p-toggleswitch` — nunca checkbox nativo estilizado à mão para essa função. Isso estende a regra que já existia só pra formulário (`app-toggle` em `listagem-padrao.md`) pra controles de tabela/listagem também. Checkbox de seleção **de linha** (marcar 1 produto entre vários pra ação em lote, ex: gerar pedido de compra) não entra nessa regra — esse é seleção múltipla de itens, não liga-desliga binário, continua checkbox comum (ou migra pra `p-checkbox` unstyled, avaliar na execução por consistência visual).

### Fase 4 — Gráficos
- `shared/components/grafico-barras/` já usa PrimeNG parcialmente — auditar se está usando `p-chart` (Chart.js) da forma unstyled/tokenizada certa, ou se tem CSS custom que deveria ir pro `pt`.
- Qualquer gráfico novo (ex: dashboards de atendimento WhatsApp, cockpit de compras) nasce em cima do mesmo componente/lib — sem lib de chart paralela.

---

## Escopo — `albatroz-site`

Site já tem `primeng ^21.1.9` instalado e segue paridade com o frontend (ADR `0003-parity-with-frontend.md` do site). Nenhum uso de `app-select-busca`/`app-toggle` equivalente foi auditado ainda nesse repo — **ação pendente:** rodar o mesmo grep (`app-select-busca|app-toggle|type="checkbox"` em contexto de liga-desliga) em `albatroz-site/src` antes de fechar o escopo dessa fase. Regra de prioridade (ADR-0006) já vale pra qualquer componente novo do site a partir de agora, independente da auditoria.

---

## Fluxo de execução

1. Fase 1 (Compras) — implementar após autorização explícita (pendente nesta conversa).
2. Fases 2-4 — cada uma vira execução própria, autorizada separadamente; não faz sentido 1 PR gigante (decisão do usuário, 2026-09-09).
3. Auditoria do site (escopo próprio) antes de decidir se vira Fase 5 ou fica junto de uma das fases do ERP.

---

## Critérios de aceite (por fase, gerais)

- [ ] Nenhuma classe de tema PrimeNG (Lara/Aura) vaza — só PassThrough + Tailwind (ADR-0003).
- [ ] Campo migrado preserva o contrato de filtro existente (`estadoLista`, restauração ao voltar de detalhe — ver `listagem-padrao.md`).
- [ ] Dark mode funciona nos novos componentes PrimeNG (herdando tokens DS via `pt`).
- [ ] `/code-review` roda no diff antes de qualquer commit/push (regra já vigente do repo).

---

## Regras de negócio

- Regra confirmada (ADR-0006, 2026-09-09): PrimeNG primeiro, Tailwind custom só quando o PrimeNG não cobre o caso.
- Regra confirmada (2026-09-09): controle de "selecionar tudo"/liga-desliga em header de listagem é toggle (`p-toggleswitch`), nunca checkbox cru — vale pra `compras-lista` e qualquer listagem futura com esse padrão.
- > TODO: confirmar se `app-toggle` mantém wrapper próprio ou é substituído por uso direto de `p-toggleswitch` em cada tela (decisão na execução da Fase 3).
- > TODO: auditoria de `albatroz-site` (escopo da migração nesse repo ainda não levantado).
