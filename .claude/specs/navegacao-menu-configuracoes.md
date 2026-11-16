# NAV-00 e CFG-00 — Menu e Central de Configurações

> Status: aprovado (2026-11-16); código concluído e validado, publicação via CI
> Autorização: usuário solicitou implementar estas duas entregas antes das demais features.

Fontes canônicas: [NAV-00](../../../albatroz-backend/.claude/specs/erp-menu-lateral.md) e [CFG-00](../../../albatroz-backend/.claude/specs/erp-central-configuracoes.md).

## Decisões

Árvore única com expansão por clique, até três níveis, ícones apenas nos módulos principais. Mesma árvore no desktop/mobile, busca, favoritos e recentes por usuário/empresa, destaque da página atual e drawer com fechamento acessível. Preferências locais não concedem autorização.

Central pesquisável com grupos por assunto, nove formulários extraídos em páginas lazy e URLs próprias, dados da empresa/usuários/perfis/Tiny mantendo destinos existentes. Formulários antigos preservam validações/payloads e uso de ngModel nesta refatoração; telas de navegação novas usam signals. Sem migração especulativa de formulários para outra abordagem nesta entrega.

Cadastro fiscal/CNAB permanece em página coerente com seções separadas; demais páginas são E-mail, Listas de preço, Metas, Condições comerciais, Estoque, Catálogos/Site, Busca de imagens e Alertas de sincronização. Conteúdo futuro IA/marca/redes não aparece como funcionalidade pronta.

APIs e banco permanecem existentes. A atribuição de flags da empresa precisa ser invalidada ao trocar sessão para não reutilizar capacidade Tiny do tenant anterior. Acesso de dashboard conserva a regra existente, compartilhada entre guard e menu, sem ampliar permissão.

## Verificação

Baseline: 11 testes originais aprovados. Resultado: 29 testes aprovados, incluindo as nove rotas, payload SMTP, proteção de alterações, leitura sem edição, três níveis, ausência de ícones nos filhos, favoritos/flags isolados por empresa e encerramento do formulário ao mudar o contexto autenticado. Build de produção aprovado. Homologação visual em Chrome headless nas larguras 1366px e 390px, sem overflow horizontal ou exceções JS, com abertura/fechamento do drawer e carga do formulário SMTP. Somente dados simulados; chamadas reais às APIs de produção foram interceptadas/bloqueadas.

## Entrega operacional

Não há tabela/chave de feature flag de navegação já inventariada. Esta reorganização de frontend pode ser liberada por versão e revertida pela imagem anterior sem alteração de dados; flag específica por empresa permanece pendência operacional caso seja exigido rollout seletivo. Não criar migração/configuração de banco apenas para a troca visual.
