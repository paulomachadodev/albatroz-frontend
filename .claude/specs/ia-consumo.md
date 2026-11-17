# IA-02 — Consumo e custos calculados

Status: aprovado pelo usuário em 2026-11-17. Fonte canônica: spec IA no backend.

Configurações → Consumo de IA, rota lazy `/configuracoes/ia/consumo`, PBAC `ia_consumo:ler`. Consulta GET `/v1/ia/consumo`, exclusivamente da empresa autenticada, sem empresa arbitrária na query. Cancelar requisições, limpar dados e sair da página após troca de empresa, usuário ou perda de permissão.

Filtros no calendário local inclusivo no início/exclusivo no fim, convertidos para instantes UTC na API, até 366 dias, finalidade, modelo, status e paginação. Datas exibidas no fuso local do navegador, conforme datas-locais.md. Resumo de todas as páginas conforme filtros. Cobertura atual somente validações Google. Exibir custo calculado em USD pela tarifa pública versionada com fonte; não representa fatura Google. Custo nulo é pendente e ausência de registros é não medido. Preservar microcustos, tokens nulos desconhecidos e zero conhecido. Thinking e cache separados, sem somar novamente.

Cadastro de credenciais e fluxos IA existentes preservados. Sem orçamento, limites, câmbio, exportação ou painel avançado nesta etapa.

Validação: suíte completa com 50 testes ChromeHeadless aprovada, incluindo sete casos novos para microcustos, nulos, ausência de medições, filtros, paginação, PBAC, isolamento e falhas. Build de produção aprovado.
