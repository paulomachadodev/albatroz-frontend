# IA-03B — Limites, reservas e alertas

Aprovada pelo usuário em 17/11/2026. Fonte canônica: backend .claude/specs/ia-consumo-configuracao-empresa.md, seção IA-03B.

Adicionar Configurações → Inteligência artificial → Limites de IA, rota /configuracoes/ia/limites, sem abas novas. Consulta exige ia_configuracoes:ler; salvar e conciliar exigem ia_configuracoes:editar. GET/PUT /v1/configuracoes/ia/limites e POST /v1/configuracoes/ia/limites/reservas/{tentativaId}/conciliacao usam os interceptores e a empresa autenticada, sem tenant fornecido no formulário.

Política nasce desligada; quando funcionalidade global estiver indisponível, mostrar apenas indisponibilidade. Orçamento mensal e por execução são opcionais e vazios representam null, enquanto zero representa limite zero. Reserva estimada por tentativa positiva (padrão USD 0,01), concorrência inteira opcional, percentual de alerta 1..100, fuso IANA e até 10 e-mails explícitos. Salvar usa a versão original para concorrência otimista; erro não anuncia sucesso nem atualiza a versão local. Valores apurados, reservados, incertos, comprometidos e disponíveis são distintos. Cobertura atual somente validações Google; estimativas não garantem teto de cobrança e valores não representam a fatura do provedor.

Reservas incertas podem ser conciliadas mediante valor explícito não negativo e justificativa de 10 a 500 caracteres, sem caracteres de controle, com confirmação e auditoria do servidor. Campo de valor começa vazio, inclusive zero precisa ser informado. Consumo anterior desconhecido com semReserva=true aparece como "Desconhecido / sem reserva", sem exibir os zeros técnicos como valor real; saldo incerto e disponível são desconhecidos nesse caso, e conciliação é permitida mediante comprovação. Não liberar reservas por idade, nem oferecer conciliação para reserva ativa. Alertas locais e estados de envio são apresentados sem pressupor SMTP configurado. Datas de instantes no horário local do navegador; competência permanece identificador de mês no fuso da política.

Limpar e cancelar consultas, ações, modais e confirmações pendentes ao trocar empresa/usuário, perder permissão ou destruir a página. Somente leitura desabilita formulário e não expõe ações de conciliação. Reaproveitar formulário base e guard de alterações não salvas, listagem paginada e modal compartilhados.

Validação: 71 testes ChromeHeadless aprovados, sendo 10 cenários próprios de IA-03B: cobertura/custo conhecido, PBAC, null/zero e versão, validação, conciliação comprovada, cancelamento por tenant/permissão/confirmação, indisponibilidade/conflito, consumo sem reserva e limites de destinatários/justificativa. Sem erros NG0101 no gate final.

MKT-03A: a capacidade da política cobre validacao_google e marketing_conteudo (somente texto homologado). Isso não representa ativação da flag de geração nem proteção dos consumidores legados. Cobertura exibida: validações Google e geração de textos de marketing.
