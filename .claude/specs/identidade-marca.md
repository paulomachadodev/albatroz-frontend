# MKT-02A — Identidade manual da marca

Status: implementação autorizada pelo usuário em 17/11/2026. Fonte canônica: backend .claude/specs/empresa-identidade-marca.md e marketing-inventario-implementacao.md.

Adicionar Configurações → Empresa → Identidade da marca, rota /configuracoes/identidade-marca, sem novas abas. PBAC identidade_marca:ler para consulta e identidade_marca:editar para salvar. Usar formulário base, guard de alterações não salvas e contexto da empresa autenticada; sem seletor de tenant.

GET/PUT /v1/configuracoes/identidade-marca com Resultado padrão. GET expõe habilitado, configurada, versao UUID|null, atualizadoEm, logoUrl/segmentoCadastro como referências somente leitura, campos de identidade e cores. PUT leva somente campos editáveis e versaoEsperada capturada da versão original (null na criação). Conflito mantém edição local, não substitui a versão e orienta atualizar antes de repetir. Flag desligada não exibe formulário nem permite mutação.

Nome de divulgação obrigatório até 160 caracteres, idioma até 35 e fuso IANA até 100. Textos propostaValor/ofertas/restricoes até 4000, tomVoz até 1000 e fontes até 500. Segmentos, públicos e regiões aceitam até 20 itens de 1 a 120 caracteres, sem duplicação independente de maiúsculas. Cores principal/secundária/fundo/texto vazias ou #RRGGBB. Paleta começa vazia; não inventar identidade. Na criação, sugerir pt-BR e fuso do navegador como valores explícitos editáveis e persistidos somente após salvar. Fontes são informação declarada, não CSS aplicado à página.

Logotipo e segmento cadastral são lidos do cadastro da empresa atual; não duplicar dados fiscais ou oferecer upload nesta fatia. Sem extração de PDF, geração IA, arte, OAuth ou publicação. Nenhum texto de roteiro futuro na tela. Limpar e cancelar dados, formulário e requisições na troca de empresa/usuário, perda de leitura/edição ou destruição da página; leitura não autoriza salvar. Toda data de instante é exibida no horário local.
