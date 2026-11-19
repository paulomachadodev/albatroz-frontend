# Design limpo (REGRA DURA)

Decidida pelo usuário em 2026-11-19, depois de telas de marketing com texto, blocos e passos demais (Conexão Meta, Estratégia editorial, Artes da peça). O padrão de referência é a tela **Inteligência artificial** (`administracao/configuracoes/.../ia-configuracao.component.html`): cabeçalho, um cartão, poucos campos, um botão principal.

Complementa `template-estrutura.md` e `reutilizar-componentes.md`. Não substitui nenhum dos dois.

## Princípios

1. **Uma tela, uma tarefa.** Se a tela tem duas tarefas (conectar a conta e configurar o catálogo), são duas telas ou duas abas, nunca dois blocos numerados na mesma página.
2. **Mostrar só o que a pessoa precisa agora.** Campo que só serve em um modo aparece quando o modo é escolhido. Informação de diagnóstico, escopos, IDs e histórico ficam recolhidos ou em tela própria.
3. **Estado antes de formulário.** A primeira coisa que a pessoa vê é o estado atual em uma linha ("Conectada", "Sem catálogo", "Última publicação hoje 10:32") e a única ação possível a partir dele.
4. **Um botão primário por tela.** `bg-primary`. Ações secundárias são botão cinza ou link de texto. Ação destrutiva é texto vermelho, nunca botão grande.
5. **Texto curto.** Título de cartão com no máximo 5 palavras. Explicação com uma frase. Instruções longas de "como preencher" ficam em um único `<details>` fechado ou no manual, não na tela.
6. **Respiro.** Cartão com `p-6`, blocos separados por `space-y-6`, no máximo 2 colunas de campos. Sem cartão dentro de cartão e sem borda dupla.
7. **Sem numeração de passos** ("1. Aplicativo", "2. Conexão") quando o estado já indica o próximo passo: mostrar só o passo que falta.
8. **Sem repetir o que o cabeçalho já diz.** O subtítulo da página não é reescrito dentro do cartão.

## Estrutura fixa de tela de configuração

```
app-breadcrumb
app-page-header (título + 1 frase)
cartão único:
  linha de estado (badge + frase)
  campos (grid de 1 ou 2 colunas, label xs, input padrão)
  [Botão primário]  [link secundário]
```

Carregando: bloco `animate-pulse`. Vazio: uma frase e a ação que resolve. Erro: `role="alert"`, texto vermelho, dizendo o que fazer.

## Limites objetivos (conferir antes de commitar)

| Item | Limite |
|------|--------|
| Campos visíveis ao abrir | até 6 |
| Botões primários na tela | 1 |
| Níveis de cartão | 1 |
| Parágrafos de explicação por cartão | 1 |
| Itens no menu de uma ação de linha | 3 (o resto vai no detalhe) |
| Colunas de tabela visíveis por padrão | até 5 |

Passou do limite: dividir em abas ou em tela de detalhe, ou esconder em "Opções avançadas" (`<details>`).

## Anti-padrões que já aconteceram

- Cartão com dois formulários e instruções de 5 passos na mesma tela (conexão Meta).
- Rótulos explicando a regra de negócio em vez de nomear o campo.
- Botões de mesmo peso lado a lado (publicar, aprovar todas, descartar, gerar) sem ordem de importância.
- Mostrar escopos técnicos (`instagram_content_publish`) a quem só quer conectar.

## Checklist de revisão de tela

- A pessoa sabe em 3 segundos o que fazer?
- Dá para tirar algum campo, texto ou botão sem perder a tarefa? Tirar.
- Tem alguma informação que só o desenvolvedor precisa? Tirar.
