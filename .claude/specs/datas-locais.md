# Datas locais no frontend

Status: implementado; aprovado pelo usuário em 2026-11-17.

Todos os instantes são exibidos no fuso local do navegador. UTC continua como representação de transporte e armazenamento; não alterar registros nem contratos de banco. Remover fusos fixos da apresentação e rótulos que anunciam UTC para datas convertidas.

Filtros por dia de eventos usam meia-noite local convertida para ISO UTC, com início inclusivo e fim exclusivo. Mês atual e data de hoje seguem o calendário local, inclusive perto da virada do dia/mês. Datas de calendário sem horário (nascimento, compra, vencimento) mantêm seu dia, sem conversão de fuso.

Auditar pipes, formatadores, exportações, valores padrão e recortes de strings em todo src. Validar regressões em fuso negativo e positivo, instantes próximos da meia-noite, datas inválidas e período aplicado na paginação. Preservar isolamento da empresa e comportamento dos demais filtros.

Auditoria: corrigidos IA (consumo e validações), WhatsApp, listas escolares, balanço/exportação, compras, estoque, vendas e data de hoje no financeiro. Pipes sem fuso explícito já estavam locais. Datas de calendário e buckets de relatórios foram preservados. Conferidos schema/consultas de enriquecimento, estoque, contagem, pedidos e DDA: TIMESTAMPTZ sem remoção do fuso; ETL mantém UTC pelo helper Hangfire. Nenhuma alteração de backend/banco necessária.

Validação: 54 testes ChromeHeadless e build de produção aprovados. Smoke com build real e API simulada nos fusos America/Sao_Paulo e Asia/Tokyo: instante 2026-01-01T00:30:00Z exibido como 31/12/2025 21:30 e 01/01/2026 09:30, respectivamente. Filtro iniciado em 01/01/2026 local enviou 03:00Z e 15:00Z do dia anterior, respectivamente. Sem erros JavaScript.
