# MKT-03A — Geração de texto do briefing confirmado

Status: aprovado pelo usuário em 18/11/2026. Fonte canônica backend: marketing-conteudo-google.md, seção MKT-03A.

Reutilizar lista de briefings com acesso ao histórico em /marketing/briefings/:id/geracoes. GET briefing atual para assunto/status; GET lista de até 20 execuções e GET detalhe. Somente briefing confirmado permite iniciar; backend revalida identidade, estratégia, permissões, chave própria e política de proteção ativa. Interface não interpreta dados comerciais ou cria conteúdo por conta própria.

POST /v1/marketing/briefings/{id}/geracoes envia apenas chaveIdempotencia UUID com marketing:criar, após confirmação clara de cobrança na conta Google da empresa. A mesma chave permanece em voo e após erro ambíguo; retomar a solicitação reaproveita a chave. Não repetir POST automaticamente. Nova geração conhecida exige ação explícita e nova chave. GETs usam marketing:ler. Cancelamento usa POST /v1/marketing/geracoes/{id}/cancelamento e marketing:editar; oferecer somente enquanto Pendente, com confirmação, revalidando resposta real do servidor.

Resultado escapado sempre identificado como rascunho para revisão humana, com legenda, CTA, hashtags, ideia visual e roteiro. Exibir estados Pendente/Executando/Concluída/Falha/Cancelada/Indeterminada, erros públicos sanitizados e versões congeladas. Sem artes, exportação, aprovação editorial ou publicação. Flag indisponível mostra indisponibilidade sem roteiro futuro.

Polling de GETs enquanto há execução ativa, cancelável ao sair, perder leitura ou trocar empresa/usuário. Cancelar consultas, POST em voo, confirmações pendentes e limpar dados; perder criação/edição cancela ações correspondentes. Destruir a tela não cancela execução já confirmada no servidor. Datas sempre no horário local. Reutilizar componentes de página/listagem/confirm existentes e PBAC nas rotas e botões.

Validação MKT-03A: 82 testes ChromeHeadless aprovados, incluindo 11 cenários de geração/rascunho literal, idempotência e erro ambíguo, clique duplo, troca de empresa e permissões, fechamento de confirmação própria, cancelamento concorrente, polling e destruição, indisponibilidade e UUID seguro no acesso HTTP local. Build de produção aprovado. Smoke CDP 1366/390 com APIs simuladas fora do repositório, sem overflow e sem erros JS; telas de rascunho e confirmação conferidas visualmente. Nenhuma chamada paga ou publicação real executada.
