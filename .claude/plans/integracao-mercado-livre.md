# Plano — Integração Mercado Livre (multitenant)

Criado em 2026-11-24. App no Mercado Livre pedido em 2026-11-24 (aguardando aprovação; depois vêm App ID e Secret Key).

## Estado
- **Fase 1 construída e testada (2026-11-24), falta validar com credenciais reais.** Backend: tabelas `integracao_marketplace_*` (script `20261124_1000_integracao_marketplace_mercado_livre.sql`, ainda não aplicado no banco de produção), `MercadoLivreController`, `MercadoLivreConexaoServico`, cliente HTTP do ML, renovação de token sob demanda (`ObterTokenValidoAsync`). Frontend: tela Configurações > Mercado Livre.
- Pendente da Fase 1: aplicar o script SQL no banco, cadastrar a URI de retorno no DevCenter, testar com App ID e Secret reais, e job periódico de renovação (hoje a renovação só ocorre quando algo pede o token).
- Fases 2 a 6: só planejadas.

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
