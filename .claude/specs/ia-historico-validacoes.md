# Histórico das validações Google

Status: aprovado em 2026-11-16 pela autorização para avançar com entregas incrementais de IA.

Página independente em Configurações → Inteligência artificial → Histórico de validações Google. Apenas usuários com `ia_configuracoes:ler` consultam a empresa autenticada, sem seletor de empresa. A troca de sessão cancela a consulta e limpa os dados.

GET `/v1/configuracoes/ia/validacoes`: período UTC inclusivo no início e exclusivo no fim, até 366 dias, paginação e resumo do período inteiro. A tela apresenta tentativas, resultados, tokens informados e registros sem uso informado. Tokens ausentes são desconhecidos, custo não apurado permanece pendente. Tokens thinking e cache são apresentados separados sem somar novamente. O histórico cobre somente validações de credencial Google e nunca promete medir todos os fluxos do ERP.

Não altera os consumidores IA existentes, não recebe nem mostra credenciais. Testes cobrem consulta, paginação, nulos, permissões e cancelamento por sessão.

Validação: seis testes específicos aprovados; suíte frontend completa com 43 testes aprovada em 2026-11-16.

Build de produção aprovado. Homologação visual em Chrome headless com dados simulados nas larguras 1366px e 390px, sem overflow horizontal ou exceções JavaScript. Cadastro com placeholder de bolinhas e valor vazio; histórico renderizando apenas metadados/tokens conhecidos, sem chamadas às APIs de produção.
