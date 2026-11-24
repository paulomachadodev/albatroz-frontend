# Plano — Integração Mercado Livre (multitenant)

Criado em 2026-11-24. App no Mercado Livre pedido em 2026-11-24 (aguardando aprovação; depois vêm App ID e Secret Key).

## Estado
- **Fase 1 construída e testada (2026-11-24), falta validar com credenciais reais.** Backend: tabelas `integracao_marketplace_*` (script `20261124_1000_integracao_marketplace_mercado_livre.sql`, ainda não aplicado no banco de produção), `MercadoLivreController`, `MercadoLivreConexaoServico`, cliente HTTP do ML, renovação de token sob demanda (`ObterTokenValidoAsync`). Frontend: tela Configurações > Mercado Livre.
- Pendente da Fase 1: aplicar o script SQL no banco, cadastrar a URI de retorno no DevCenter, testar com App ID e Secret reais.
- **Fase 2 construída e testada com mocks (2026-11-24), falta validar com credenciais reais.** Decisão: a busca roda no **ERP** (job Hangfire `buscar-imagens-produto-mercado-livre`, 01:30, `BuscarImagensProdutoMercadoLivreAppServico`), não no Albatroz.IA, porque token e cifra do ML moram no ERP. Todo o código do Google saiu do Albatroz.IA, e o job antigo `buscar-imagens-produto` é removido do Hangfire da IA (`RemoveIfExists`). Tela Busca de imagens (Google) removida. Revisão de candidatas mostra origem, selo de GTIN e link. Script `20261124_1100_busca_imagens_mercado_livre.sql` (colunas `link_anuncio`, `gtin_confirmado`, tabela `produto_imagem_busca`, apaga chaves do Google) aplicado pelo usuário em 2026-11-24.
- Job `manter-conexoes-mercado-livre` (a cada 4 h) renova os tokens das conexões ativas. Decidido em 2026-11-24: o enriquecimento por IA continua exigindo foto, sem mudança.
- Pendente da Fase 2: validar a forma real das respostas de `products/search` e `products/{id}` com credenciais (parser tolerante, mas não testado contra a API), limite diário hoje é global (`Marketplaces:LimiteDiarioBuscaImagens`, 100), falta campo por empresa no passo da integração.
- Fases 3 a 6: só planejadas.

Regra do CLAUDE.md: cada fase só conta como entregue com backend (`albatroz-backend`) e tela (`albatroz-frontend`) prontos. Parar no meio exige registrar aqui.

## Motivação
Produto novo sem foto nunca entra no enriquecimento por IA (job exige imagem ativa) e a busca de imagens pelo Google Custom Search retorna 403 em produção (projeto sem acesso à API). Fonte nova: catálogo do Mercado Livre, buscando por GTIN.

## Regras que valem para todas as fases
- Multitenant: `empresa_id BIGINT NOT NULL` em toda tabela, filtro por empresa em toda query, credenciais por empresa. Nada hardcoded para a Albatroz.
- Segredos: client secret, access token e refresh token cifrados com o padrão de `ICifradorSegredosSociais` (AES-GCM com contexto empresa+uid). Nunca voltam para a tela (só "configurado"), nunca vão para log.
- Plataforma externa: ids do ML em tabela de referência externa (`plataforma = 'mercado_livre'`), nunca coluna `ml_id` na entidade (erp-saas-arquitetura.md).
- Backend: CQRS (AppServico/Consulta), `Resultado<T>`, DTOs `*Requisicao/*Resposta`, scripts SQL datados em `scripts/Albatroz.ERP`.
- Frontend: standards `reutilizar-componentes`, `design-limpo`, `template-estrutura`, `listagem-padrao`, `carregamento-de-pagina`. Ações de linha com `app-btn-icone`. Referência visual: tela Inteligência artificial e `conexao-meta`.
- Sem comentários em código. `/code-review` + `revisao-pre-commit` + `npm test` antes de cada commit.
- Chamadas ao ML com limite de taxa, retry com backoff e renovação automática de token.

## Fase 1 — Tela de configuração e conexão
Backend
- Tabelas: aplicativo do marketplace (empresa, provedor, client_id, secret cifrado, uid, versão otimista) e conexão (seller_id, apelido, access/refresh cifrados, expira_em, status, última renovação).
- Endpoints: salvar aplicativo, testar credenciais (client_credentials), iniciar conexão OAuth, callback, desconectar, status.
- Worker (Hangfire, por empresa) que renova token antes de expirar e marca "precisa reconectar" em falha.
Frontend
- Configurações > Integrações > Mercado Livre, em 3 passos numerados: 1) colar App ID e Secret, 2) conectar conta, 3) testar. Cada passo mostra estado (feito/pendente) e uma explicação curta. Mesmo molde servirá para as próximas integrações.
- Entrada em `configuracoes-catalogo.ts`, permissão própria.

## Fase 2 — Busca de imagens pelo ML
Backend (Albatroz.IA)
- Novo provedor de busca de imagens por GTIN no catálogo do ML (token de aplicativo, sem OAuth de vendedor). Sem GTIN ou sem match: busca por marca+nome, marcada como "não confirmada".
- Foto mínima 800px; grava em `produto_imagem_candidata` com motivo e link do anúncio de origem. Nunca grava direto no produto.
- Provedor escolhido por empresa; Google Custom Search sai do caminho.
- **Remover o Google Custom Search no mesmo commit em que o ML entra** (decidido em 2026-11-24, a API retorna 403 em produção e está sendo descontinuada pelo Google): `GoogleCustomSearchServico` e `IGoogleCustomSearchServico`, o verificador de página ligado a ele, a tela Configurações > Busca de imagens (`busca-imagens-configuracao`, rota e entrada no catálogo), e as chaves `google_custom_search_api_key`, `google_custom_search_engine_id` e `google_custom_search_limite_diario` (apagar também o valor guardado no banco). Manter o job `buscar-imagens-produto`, a tabela `produto_imagem_candidata` e a tela de revisão. Atualizar o manual em `.claude/manual` e o limite diário passa para o passo de integração do ML.
- Decidir à parte: enriquecimento por IA do texto não depender de foto (ou rodar logo após aprovar a foto).
Frontend
- Tela de revisão de candidatas existente passa a mostrar origem (ML), se o GTIN foi confirmado e o link do anúncio.
- Configuração de limite diário no passo da integração.

## Fase 3 — Anúncios (listar, criar, editar)
Backend
- Tabela de anúncio (empresa, produto, status, preço, estoque, tipo de anúncio, permalink, última sincronização) + referência externa.
- Criar: categoria sugerida pelo ML, atributos obrigatórios, fotos do produto, tipo de anúncio. Editar: título, preço, estoque, status (pausar/ativar). Sincronização de estoque ERP → ML.
Frontend
- Listagem com `app-listagem-paginada`, filtros e ações por ícone (editar, pausar, abrir no ML). Criar anúncio em fluxo curto a partir do produto.

## Fase 4 — Pontuação e qualidade
Backend: consultar saúde/qualidade do anúncio no ML, guardar nota e pendências, atualizar por job.
Frontend: coluna de pontuação na listagem e detalhe com o que falta para melhorar.

## Fase 5 — Pedidos
Backend
- Receber notificações de pedidos (webhook) e/ou consulta periódica, gravar em staging e processar para o ERP pelo mesmo caminho do ETL de pedidos, com plataforma `mercado_livre` e idempotência por id externo.
- Status, envio e cancelamento refletidos no pedido.
Frontend: pedidos do ML na listagem de vendas, com origem identificada.
Risco: se o Tiny já integra o ML da loja, o pedido pode entrar duas vezes. Resolver antes de ligar.

## Fase 6 — Preço dinâmico
Backend
- Regras por empresa: custo, margem mínima, piso e teto, "X% abaixo do concorrente", por categoria ou produto.
- Coleta de preço da concorrência no catálogo do ML, cálculo da sugestão, histórico e auditoria de toda alteração.
- Começa em modo **sugestão** (usuário aprova); modo automático só depois e com trava de limite de variação por execução.
Frontend: tela de regras simples, simulação antes de ativar, histórico de alterações.

## Pendências e decisões
- Aprovação do app no ML; receber App ID e Secret Key (colar só no servidor/tela, nunca em arquivo do repositório).
- Redirect URL do formulário foi `https://albatrozpapelaria.com.br`. O OAuth da Fase 1 precisa de callback do ERP; ajustar no DevCenter depois da criação do app.
- Confirmar se o Tiny já integra o Mercado Livre (afeta Fases 3 e 5).
- Definir se o enriquecimento por IA deixa de exigir foto.

## Decisões de 2026-11-24 (usuário)
- O Tiny integra o ML da loja hoje, e a intenção é **desligar a integração do Tiny depois que a nossa estiver pronta**. Então as Fases 3 e 5 esperam as credenciais do ML. Antes de ligar pedidos (Fase 5), definir o corte: nunca os dois ligados ao mesmo tempo, para não duplicar pedido.
- Enriquecimento por IA continua como está (exige foto).

## Desenho: de/para de categorias e atributos obrigatórios (Fase 3)
Objetivo: o usuário confirma uma vez por categoria, não por produto.

1. **Categoria sugerida.** Para o produto, consultar o previsor de categoria do ML (nome + marca) e pedir à IA que ordene as sugestões. Mostrar até 3 opções com o caminho completo. O usuário confirma a categoria do ERP (grupo do produto) uma vez e fica salva.
2. **Tabela de mapa de categoria** por empresa: categoria do ERP, categoria do ML, quem confirmou, quando. Produto novo da mesma categoria herda sem perguntar.
3. **Atributos obrigatórios por categoria.** Ler do ML a lista de atributos da categoria escolhida (obrigatórios, condicionais, tipo, valores permitidos) e guardar em cache com data. Revalidar a cada anúncio, porque o ML muda exigências.
4. **Preenchimento em cascata, do mais confiável ao menos:** (a) dado do ERP (marca, GTIN, peso, medidas, NCM); (b) atributos do produto do catálogo do ML quando o GTIN bate; (c) IA extraindo do nome e descrição, sempre marcado "sugerido pela IA"; (d) pergunta ao usuário.
5. **Tabela de mapa de atributo** por empresa e categoria do ML: atributo do ML, origem (campo do ERP, valor fixo ou pergunta), valor padrão. Resposta do usuário vira padrão da categoria.
6. **Tela de prontidão** por produto: "Pronto", "Falta 2 campos" ou "Sem categoria", com os campos faltando editáveis ali mesmo. Só produto "Pronto" publica.
7. **Campos novos no produto do ERP, só se faltar:** modelo, cor, garantia, quantidade por embalagem, condição. Levantar quais a categoria real pede antes de criar coluna.
8. **Peso e medidas.** O ERP já recebe peso bruto, peso líquido, largura, altura e comprimento do Tiny. Usar esses. O catálogo do ML descreve o produto, mas peso e medidas de embalagem de envio normalmente são do vendedor. Se o catálogo trouxer, entra só como sugestão quando o ERP estiver vazio. Confirmar com credenciais.
