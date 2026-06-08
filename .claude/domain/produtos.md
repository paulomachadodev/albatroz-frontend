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

**Upload de imagem**
- Operador seleciona produto e envia imagem.
- Frontend envia multipart para o backend.
- URL do CDN é retornada e exibida imediatamente.

## Vocabulário

| Termo | Significado |
|---|---|
| SKU | Código identificador do produto no contexto de estoque |
| Situação ativa/inativa | Determina se o produto aparece no catálogo e em seletores |
| CDN | Rede de distribuição de imagens (Cloudflare R2 / cdn.albatroz.com.br) |
