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

## Validação

Build do projeto não quebra com nenhum formato — mas **revisar PRs visualmente** para garantir que não retornaram ao `'short'`.

## Referências

- Componentes já formatados: `etl-visao-geral-page`, `etl-contexto-page` (linhas 101/104 e 94/97)
- Serviço legado (não remover): `etl-painel` usava `toLocaleString('pt-BR', ...)` no componente
