# Confirmação antes de ação crítica

> Regra fixa (2026-07-29): toda ação que altera estado de forma difícil de reverter, ou que dispara efeito visível pra outras pessoas (cliente, outro funcionário), precisa de confirmação explícita do usuário antes de executar.

## O que conta como "crítico"

- Libera/publica algo que passa a valer pra terceiros (ex: liberar lista de cotação — dispara notificação automática pro cliente).
- Exclui registro.
- Ação que dispara envio de mensagem/e-mail/notificação externa.
- Reverte ou desfaz algo já processado (ex: reabrir lista liberada, cancelar pedido).

**Não conta** como crítico: salvar campo de formulário (auto-save on blur/change já é o padrão — ver `lista-detalhe.component.ts`), trocar filtro, navegação.

Ver @standards/angular/mensagens-feedback.md pro padrão geral de toast/confirmação (o "como"). Este arquivo cobre só o "quando".

## Padrão de implementação

> Atualizado (2026-07-30): `window.confirm(...)` foi substituído — o popup nativo do navegador quebra o visual da tela e não segue o padrão de feedback do app. Usar `ConfirmService` (`core/feedback/confirm.service.ts`) + `ConfirmDialogComponent` (`core/feedback/confirm-dialog.component.ts`), montado uma vez no `ShellComponent` junto do `ToastContainerComponent`.

Mensagem sempre explica a consequência, não só "tem certeza?":

```typescript
async liberarLista() {
  const confirmado = await this.confirm.confirmar(
    'Liberar essa lista?',
    'A cotação passa a valer pra qualquer cliente que perguntar por ela, e quem já solicitou é notificado automaticamente.',
    { textoConfirmar: 'Liberar' }
  );
  if (!confirmado) return;

  // ação real...
}
```

`ConfirmService.confirmar(titulo, mensagem?, opcoes?)` retorna uma `Promise<boolean>` — `true` se o usuário confirmou. `opcoes.textoConfirmar`/`textoCancelar` trocam o texto padrão dos botões ("Confirmar"/"Cancelar") quando a ação tem um verbo mais específico (ex: "Liberar", "Excluir").

Injetar `ConfirmService` no construtor do componente (mesmo padrão do `ToastService`).
