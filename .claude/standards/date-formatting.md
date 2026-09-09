# Padrão: Formatação de Data/Hora

## Regra: Sempre usar formato brasileiro 24h, nunca `'short'`

A pipe Angular `| date: 'short'` é **locale-dependent** e produz formato americano (`M/d/yy, h:mm a`) mesmo quando o navegador está em PT-BR. Proibido usar.

## Formatos Recomendados

### Com hora (datas de execução, timestamps)
```html
{{ data | date: 'dd/MM/yy, HH:mm' }}
```
Resultado: `03/07/26, 16:12`

Casos: Última execução, próxima execução, data de criação com hora.

### Apenas data
```html
{{ data | date: 'dd/MM/yyyy' }}
```
Resultado: `03/07/2026`

Casos: Data de nascimento, data de emissão, vencimentos.

### Data curta sem ano (relatórios intra-mês)
```html
{{ data | date: 'dd/MM' }}
```
Resultado: `03/07`

Casos: Listagens, históricos, logs.

## Implementação

- Template: use a pipe diretamente (exemplos acima)
- Component: para lógica complexa, use `new Date(iso).toLocaleString('pt-BR', {...})` com formatação explícita

## ⚠️ Nunca chamar `formatDate()` de `@angular/common` com locale `'pt-BR'` explícito

Incidente 2026-09-09: `compras-lista.component.ts` tinha um `formatarData()` que chamava
`formatDate(valor, 'dd/MM/yyyy', 'pt-BR', 'America/Sao_Paulo')` (a função standalone, não a pipe).
O app **nunca registra** `registerLocaleData(localePt)` em lugar nenhum — `formatDate()` lança
exceção quando o locale pedido não está registrado, e o `try/catch` ao redor engolia o erro e
sempre devolvia `'-'`. Resultado: colunas de data (Última Compra/Venda no relatório de compras)
ficavam permanentemente vazias, com dado correto no banco e no backend — só a formatação quebrava,
silenciosamente, pra qualquer valor.

`app.config.ts` agora registra o locale (`registerLocaleData(localePt)` antes do `ApplicationConfig`),
então `formatDate(..., 'pt-BR', ...)` funciona hoje — mas **prefira sempre a pipe `| date:`** (usa o
`LOCALE_ID` injetado, não quebra mesmo sem registro) ou `toLocaleString('pt-BR', ...)` (nativo do
JS, nunca depende de registro do Angular). Se usar `formatDate()` standalone de novo, sempre com
`try/catch` que **loga o erro** (não engole silencioso) — um catch mudo transforma um bug óbvio (tela
quebrada) num bug invisível (dado sumido sem pista).

## Validação

Build do projeto não quebra com nenhum formato — mas **revisar PRs visualmente** para garantir que não retornaram ao `'short'`.

## Referências

- Componentes já formatados: `etl-visao-geral-page`, `etl-contexto-page` (linhas 101/104 e 94/97)
- Serviço legado (não remover): `etl-painel` usava `toLocaleString('pt-BR', ...)` no componente
