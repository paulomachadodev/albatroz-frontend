# Produtos — Domínio de Negócio (Frontend)

## Conceito

O frontend exibe o catálogo de produtos sincronizado do Tiny ERP. O ERP Albatroz **não é a fonte de verdade do cadastro** — o Tiny é. O frontend consome dados já processados pelo backend e permite visualização, busca e upload de imagens.

Ver domínio completo de produtos em: backend `.claude/domain/produtos.md`.

## Entidades de negócio (visão frontend)

**Produto**
- Identificado por id numérico interno.
- Possui nome, descrição, SKU e preço.
- Tem saldo de estoque.
- Pode ter múltiplas imagens (URLs de CDN).
- Possui timestamps de criação e atualização.

## Fluxos relevantes para UI

**Listagem de produtos**
- Produtos são listados com paginação e filtro por nome/SKU.
- Produto inativo não deve aparecer em buscas de catálogo.

**Upload de imagem** (`produtos-detalhe`, aba Imagens)
- Grid fixo de **8 slots** (`maximoImagens` em `produtos-detalhe.component.ts`) — máximo de imagens por produto, mesmo valor validado no backend (`UploadImagemProdutoAdminAppServico.MaximoImagensPorProduto`).
- Slot vazio só é clicável/aceita drop se for o **primeiro vazio** (regra sem-buraco: não dá pra ocupar o slot 3 com o 2 vazio) — os demais aparecem bloqueados/opacos.
- Drop de múltiplos arquivos no primeiro slot vazio preenche em sequência (1, 2, 3...) truncando no limite de 8; nome do arquivo é irrelevante aqui (diferente do importador em lote, que usa `código_índice`).
- Drop de arquivo em cima de slot **ocupado** substitui: exclui a imagem atual e sobe a nova no mesmo índice (delete + upload sequenciados no frontend, sem endpoint dedicado).
- Reordenar = drag entre slots ocupados (`reordenarImagens` — reescreve o índice de TODAS as imagens envolvidas, inclusive as de origem `tiny`/sync do Tiny ERP; próximo sync do Tiny pode resetar a ordem de imagens `tiny`, é comportamento conhecido/aceito, não é bug).
- Importação em lote (`produtos-importar-imagens`) é separada — casa arquivo com produto pelo nome `código_índice.ext`, pode inserir em vários produtos de uma vez, e empurra (shift) índice ocupado em vez de bloquear. Mesmo limite de 8 por produto — excedente é ignorado e listado com motivo na prévia (coluna Status), e logado como warning no Seq.

**Elegibilidade de marketplace/site** (`produtos-detalhe`, aba Web → seção Marketplaces)
- Cada canal (Google Shopping, Instagram/Facebook, Site Albatroz) tem critério próprio de elegibilidade calculado no backend (GTIN + categoria Google + preço + imagem + situação ativa pros marketplaces; só situação ativa + imagem pro site) — ver `ListarMarketplacesProdutoConsulta`/`ElegibilidadeMarketplaceServico` no backend.
- **Regra (2026-08-31):** qualquer edição do produto que possa afetar esses critérios — dados gerais (preço, GTIN, situação), enriquecimento/categoria Google, upload/exclusão/substituição de imagem, reenriquecimento via IA — precisa reavaliar a elegibilidade exibida na aba, não só os dados que a própria ação alterou. Ficou stale até o usuário sair e voltar pra aba porque `carregarMarketplaces()` só era chamado uma vez (guard `!this.enriquecimento()`), nunca depois de salvar.
- Padrão de fix: hook central de recarga pós-save (`recarregarSilencioso()` em `produtos-detalhe.component.ts`) chama `carregarMarketplaces()` de novo — só se `this.marketplaces().length > 0` (ou seja, a aba já foi aberta ao menos uma vez nessa sessão; produto que nunca teve a aba visitada não precisa de refresh antecipado). Handlers de save que não passam por `recarregarSilencioso()` (ex: `reenriquecerViaIa()`) repetem a mesma checagem inline.
- Toda tela nova com abas/seções derivadas que dependem de dados que outras abas podem alterar deve seguir esse mesmo padrão: 1 ponto central de "recarregar depois de salvar" que também atualiza as abas com dado potencialmente stale, não só a aba que originou o save.

## Vocabulário

| Termo | Significado |
|---|---|
| SKU | Código identificador do produto no contexto de estoque |
| Situação ativa/inativa | Determina se o produto aparece no catálogo e em seletores |
| CDN | Rede de distribuição de imagens (Cloudflare R2 / cdn.albatrozpapelaria.com.br) |
