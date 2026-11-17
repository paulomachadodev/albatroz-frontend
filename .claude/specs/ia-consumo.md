# IA-02 — Consumo e custos calculados

Status: aprovado pelo usuário em 2026-11-17. Fonte canônica: spec IA no backend.

Configurações → Consumo de IA, rota lazy `/configuracoes/ia/consumo`, PBAC `ia_consumo:ler`. Consulta GET `/v1/ia/consumo`, exclusivamente da empresa autenticada, sem empresa arbitrária na query. Cancelar requisições, limpar dados e sair da página após troca de empresa, usuário ou perda de permissão.

Filtros no calendário local inclusivo no início/exclusivo no fim, convertidos para instantes UTC na API, até 366 dias, finalidade, modelo, status e paginação. Datas exibidas no fuso local do navegador, conforme datas-locais.md. Resumo de todas as páginas conforme filtros. Cobertura atual somente validações Google. Exibir custo calculado em USD pela tarifa pública versionada com fonte; não representa fatura Google. Custo nulo é pendente e ausência de registros é não medido. Preservar microcustos, tokens nulos desconhecidos e zero conhecido. Thinking e cache separados, sem somar novamente.

Cadastro de credenciais e fluxos IA existentes preservados. Sem orçamento, limites, câmbio, exportação ou painel avançado nesta etapa.

Validação: suíte completa com 50 testes ChromeHeadless aprovada, incluindo sete casos novos para microcustos, nulos, ausência de medições, filtros, paginação, PBAC, isolamento e falhas. Build de produção aprovado.


## IA-03A — Painel e exportação

Aprovado pelo usuário em 2026-11-17, conforme fonte canônica do backend. Ampliar a consulta existente com módulo, provedor e fuso IANA do navegador. Painel opcional agrega todas as páginas com os mesmos filtros: custo diário no calendário local, distribuição por finalidade/modelo, contagem de tentativas e custos pendentes. Exibir início real da medição do tenant e cobertura atual sem atribuir custo aos fluxos não instrumentados. Custo desconhecido permanece null no gráfico e "Pendente" na leitura textual acessível; não converter a zero nem confundir tarifa pública com fatura.

Exportação CSV em GET /v1/ia/consumo/exportacao, com permissão própria ia_consumo:exportar, filtros aplicados e fuso. Backend limita a 10000 linhas e sanitiza CSV; UI interpreta erros JSON recebidos como Blob. Cancelar download ao trocar usuário/empresa, perder permissão ou aplicar outra consulta; resposta antiga nunca deve gerar arquivo. HTTP usa interceptores existentes e tenant autenticado, sem aceitar empresa pela query. Nome do arquivo preserva o período aplicado no início da solicitação.

IA-03B (limites, reservas e alertas) permanece fora desta entrega. Cadastro e fluxos de geração existentes preservados.

Validação IA-03A: 60 testes ChromeHeadless aprovados, incluindo regressões de agregados/dias locais, microcustos e nulos, filtros aplicados, PBAC de exportação, cancelamento de download por tenant/permissão e descarte de erro Blob após destruir a página. Build de produção aprovado.

IA-04: a mensagem de cobertura deve obedecer ao campo cobertura da resposta. validacao_google indica somente validação de chave; fluxos_google indica validações e fluxos Google instrumentados, sem alegar cobertura de todo ERP, n8n ou WhatsApp. Valor desconhecido/ausente não assume cobertura ativa. Limites de IA mantêm sua cobertura própria conforme o serviço responsável.
