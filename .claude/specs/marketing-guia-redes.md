# Guia contextual e perfis sociais editoriais

Aprovado em 18/11/2026. Fonte canônica: backend .claude/specs/marketing-guia-redes.md.

Ajuda por campo nas telas Marca, Estratégia e Briefing usando botão de teclado/clique e PrimeNG Popover, contendo finalidade e exemplo genérico apenas para leitura. Guia expansível no Marketing em cinco etapas (marca, perfis, estratégia, briefing, geração), com navegação conforme PBAC. Nenhum exemplo sobrescreve dados; sem IA nem tracking externo.

Configurações → Redes sociais, rota /configuracoes/redes-sociais, PBAC integracoes_sociais:ler/criar/editar. GET /v1/integracoes-sociais/perfis retorna {habilitado,itens}; POST cria perfil com plataforma1Facebook2Instagram3TikTok4WhatsApp,nome1..120,identificador1..160,ativo; PUT /{id} inclui versaoEsperada. Perfil retorna versao, datas e autorizacaoPendente=true. Inativar usa PUT, sem exclusão de histórico. Estado sempre autorização pendente; nenhum botão Conectar falso, senha, token ou segredo. Guia explica App Meta da plataforma e conta da empresa com link oficial para localizar aplicativos. WhatsApp atual preservado.

GET /v1/marketing/filtros com marketing:ler fornece {redesSociaisHabilitado,perfis,redes}, apenas perfis ativos da empresa atual. Briefing escolhe plataforma em p-select e estratégia em p-multiSelect da mesma fonte; não são contas OAuth autorizadas. Sem perfis orienta cadastro com link autorizado, sem fallback inventado. Valores antigos fora da lista permanecem visíveis explicitamente, sem reapresentá-los como opção ativa. Quando flag de perfis estiver desligada, preservar contratos existentes e informar indisponibilidade sem bloquear briefings já existentes. Formatos genéricos e linhas da estratégia orientam seleção.

Toda consulta/ação/overlay limpa contexto ao trocar empresa/usuário ou perder permissão, e cancela assinaturas ao destruir. Datas exibidas localmente. Scripts de banco e flags operacionais ficam a cargo do fluxo manual do backend. Gates: testes, build e smoke desktop/celular com APIs simuladas, sem chamadas pagas.
