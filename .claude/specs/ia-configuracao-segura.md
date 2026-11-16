# IA-01 — Cadastro isolado da credencial Google

> Status: aprovado pelo usuário em 2026-11-16; implementação limitada ao cadastro isolado.

Fonte canônica: ia-consumo-configuracao-empresa.md no backend. Entrega atual: Configurações > Inteligência artificial, chave própria e modelo, estado e marcador mascarado. Somente empresa autenticada; PBAC ia_configuracoes ler/editar/excluir no catálogo, rota e ações. Sem seletor de empresa ou segredo retornado pelo GET.

A chave nunca preenche o campo nem é persistida no navegador; é limpa após a tentativa, destruição e troca de contexto. Salvar exige confirmação da chamada mínima potencialmente faturável. Falha de validação mantém configuração anterior. Formulário reaproveita cancelamento de requisições por troca de contexto e proteção de alterações pendentes.

O backend responde habilitado=false enquanto a implantação segura estiver pendente, bloqueando cadastro/remoção. Cadastrar/remover não altera fluxos em produção. Sem painel de consumo, migração de consumidores existentes, limites ou Marketing nesta entrega.

Validação: 37 testes ChromeHeadless aprovados (7 novos), build de produção aprovado. Casos novos cobrem PBAC, bloqueio por implantação pendente, confirmação de custo, limpeza do segredo, preservação após falha, exclusão confirmada/cancelada e troca de contexto durante confirmação/requisição.
