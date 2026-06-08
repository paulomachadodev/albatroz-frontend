# Albia — Domínio de Negócio (Frontend)

## Conceito

Albia é o assistente de IA do ERP Albatroz, baseado no Gemini. No frontend, Albia expõe fluxos de **cotação de compras**: o usuário descreve o que precisa e a IA retorna sugestões de itens, quantidades e preços estimados.

A IA não executa ações — ela sugere. O usuário confirma ou ajusta antes de qualquer operação.

## Entidades de negócio

**Cotação**
- Solicitação de compra gerada pela IA para um conjunto de itens.
- Possui status (pendente, válida, expirada) e data de validade.
- Contém lista de itens com descrição, quantidade, preço unitário e total.

**Item de Cotação**
- Produto ou serviço sugerido pela IA dentro de uma cotação.
- Possui descrição livre (pode não corresponder exatamente a um produto do catálogo).
- Preço unitário é estimativa — não é vinculante.

## Regras

- Cotações expiradas não podem ser confirmadas.
- A IA pode sugerir itens que não existem no catálogo — cabe ao usuário mapear para produtos reais.
- O frontend exibe "veredito da IA" e justificativas — ver `ds-ai-insight` skill para padrão de exibição.

## Fluxos

**Solicitar cotação**
1. Usuário descreve necessidade em linguagem natural.
2. Frontend envia para o serviço Albia (API IA em porta separada do ERP).
3. IA retorna cotação com itens sugeridos.
4. Frontend exibe itens com preços e permite ajuste antes de confirmar.

## Vocabulário

| Termo | Significado |
|---|---|
| Albia | Nome do assistente IA do ERP Albatroz |
| Cotação | Sugestão de compra gerada pela IA, com itens e preços estimados |
| Veredito da IA | Análise/justificativa exibida pelo componente ds-ai-insight |
| API IA | Serviço separado do ERP principal (porta 5200 dev / 8081 prod) |
