# Confirmação antes de ação crítica

> Regra fixa (2026-07-29): toda ação que altera estado de forma difícil de reverter, ou que dispara efeito visível pra outras pessoas (cliente, outro funcionário), precisa de confirmação explícita do usuário antes de executar.

## O que conta como "crítico"

- Libera/publica algo que passa a valer pra terceiros (ex: liberar lista de cotação — dispara notificação automática pro cliente).
- Exclui registro.
- Ação que dispara envio de mensagem/e-mail/notificação externa.
- Reverte ou desfaz algo já processado (ex: reabrir lista liberada, cancelar pedido).

**Não conta** como crítico: salvar campo de formulário (auto-save on blur/change já é o padrão — ver `lista-detalhe.component.ts`), trocar filtro, navegação.

## Padrão de implementação

Mais simples: `window.confirm(...)` com mensagem que explica a consequência, não só "tem certeza?":

```typescript
liberarLista() {
  const confirmado = window.confirm(
    'Liberar essa lista? A cotação passa a valer pra qualquer cliente que perguntar por ela, e quem já solicitou é notificado automaticamente.'
  );
  if (!confirmado) return;

  // ação real...
}
```

Se o projeto adotar um modal de confirmação mais elaborado no futuro (design system), substituir `window.confirm` por ele — mas a regra de sempre confirmar antes de ação crítica continua valendo independente do componente usado.
