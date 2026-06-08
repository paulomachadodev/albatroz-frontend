# Financeiro — Domínio de Negócio

## Conceito

O módulo financeiro do frontend expõe o controle de cartões de crédito corporativos: cadastro de cartões, acompanhamento de faturas, lançamento e categorização de despesas, e extração automática de faturas em PDF via IA.

É o contexto mais completo do frontend atual — serve como referência de padrão para novos contextos.

## Entidades de negócio

**Cartão**
- Cartão de crédito corporativo associado a uma empresa (tenant).
- Pode ser **principal** ou **adicional** (vinculado a um cartão principal).
- Identificado por apelido e últimos 4 dígitos.
- Possui bandeira (Visa, Mastercard, etc.), dia de vencimento e dia de fechamento.
- Tem limite total, limite usado e limite disponível.
- Pode estar ativo ou inativo.
- Portador é um contato da empresa (idContatoPortador + portadorNome).

**Fatura**
- Fatura mensal de um cartão para um mês/ano de referência.
- Possui data de vencimento e data de fechamento.
- Valor total = soma das despesas + taxas e anuidades.
- **Status:** Aberta (1), Processada (2), Paga (3).
- Pode ter um PDF de extrato associado (pdfUrl).

**Despesa de Cartão**
- Lançamento financeiro dentro de uma fatura.
- Pode ser parcelada (parcelaAtual / totalParcelas).
- **Origem:** Fatura/PDF (1), Projetada/projeção futura (2), Manual (3).
- **Status:** Pendente (1), Confirmada (2), Paga (3).
- Possui categoria de despesa opcional.
- O campo `previsaoEncontrada` é flag de UI: indica se a despesa foi reconciliada com uma parcela projetada de meses anteriores.

**Parcela Projetada**
- Despesas parceladas geram projeções automáticas para faturas futuras.
- O frontend exibe projeções em um modal específico (projeção-modal).
- Usuário pode selecionar quais parcelas incluir numa fatura futura.

**Categoria de Despesa**
- Classificação livre para agrupar despesas (ex: Alimentação, Viagem, TI).
- Pertence à empresa (tenant). Pode estar ativa ou inativa.

## Regras

- Um cartão adicional herda o limite do cartão principal — os limites são consolidados.
- Fatura com status Paga não aceita novos lançamentos de despesa.
- Fatura processada (status 2) significa que o PDF foi extraído e as despesas foram importadas.
- Despesas de origem Fatura (1) vêm da extração automática de PDF — podem ter descrição original diferente da editada pelo usuário.
- A extração de fatura é assíncrona: usuário faz upload do PDF → backend processa via Hangfire → frontend faz polling até receber status final.
- Categorias inativas não aparecem em seletores de nova despesa.

## Fluxos

**Extração de fatura (PDF → despesas)**
1. Usuário seleciona cartão e mês/ano e faz upload do PDF de extrato.
2. Frontend envia o arquivo ao backend (multipart/form-data).
3. Backend enfileira job Hangfire e retorna jobId imediatamente.
4. Frontend faz polling do status do job (a cada ~2s) enquanto exibe spinner.
5. Quando job conclui, frontend atualiza a lista de despesas automaticamente.
6. Despesas importadas ficam com origem=1 (Fatura) e status=1 (Pendente).

**Cadastro de cartão**
1. Usuário abre modal de cartão (cartao-modal).
2. Preenche apelido, últimos 4 dígitos, bandeira, dia de vencimento, dia de fechamento e limite.
3. Pode vincular a um cartão principal para criar adicional.
4. Salva → cartão aparece no dashboard de cartões.

**Categorização de despesa**
1. Usuário vê lista de despesas de uma fatura.
2. Abre despesa e seleciona categoria via categoria-select.
3. Categoria é salva inline na despesa.

## Vocabulário

| Termo | Significado |
|---|---|
| Cartão principal | Cartão titular da conta; pode ter adicionais vinculados |
| Cartão adicional | Cartão vinculado a um principal; portador distinto |
| Fatura | Demonstrativo mensal de gastos de um cartão |
| Extração | Processo de ler um PDF de fatura e importar as despesas automaticamente |
| Projeção | Parcelas futuras calculadas a partir de despesas parceladas já conhecidas |
| Reconciliação | Match entre uma despesa importada e uma parcela projetada previamente |
| Polling | Técnica frontend de verificar periodicamente o status de um job assíncrono |
| Portador | Pessoa (contato da empresa) responsável pelo cartão |
| Dia de fechamento | Dia do mês em que a fatura é fechada para novos lançamentos |
| Dia de vencimento | Dia do mês em que o pagamento da fatura vence |
