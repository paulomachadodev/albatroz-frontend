# Mensagens e feedback pro usuário

> Regra fixa (2026-07-30): nenhum código novo usa `alert()`, `window.confirm()` ou `window.prompt()`. Todo feedback visual passa pelos serviços abaixo — eles já cuidam de estilo, dark mode e posicionamento consistente com o resto do app.

## Toast — feedback não bloqueante (sucesso, erro, aviso, info)

Serviço: `core/feedback/toast.service.ts` (`ToastService`). Montado uma vez em `ShellComponent` via `<app-toast-container>`.

```typescript
constructor(private toast: ToastService) {}

salvar() {
  this.service.salvar(dados).subscribe({
    next: () => this.toast.sucesso('Salvo com sucesso.'),
    error: err => this.toast.erroServidor(err, 'Não foi possível salvar.')
  });
}
```

- `toast.sucesso(titulo, mensagem?)` / `toast.erro(...)` / `toast.aviso(...)` / `toast.info(...)` — uso direto quando a mensagem é fixa.
- `toast.erroServidor(err, fallback)` — **sempre** usar em `error:` de chamadas HTTP. Extrai `ProblemDetails.detail` do backend quando existe (mensagem real do domínio) e só cai no `fallback` se o servidor não mandou nada específico. Nunca escrever `err.message` cru na tela.
- Título curto e direto ("Salvo com sucesso.", "Item excluído."). Mensagem (segundo parâmetro) só quando há detalhe adicional relevante (ex: quantos contatos foram notificados).

## Confirmação — ação crítica que precisa de decisão do usuário

Ver @standards/angular/confirmacao-acao-critica.md pra regra de **quando** confirmar. Aqui é o **como**:

Serviço: `core/feedback/confirm.service.ts` (`ConfirmService`) + `core/feedback/confirm-dialog.component.ts` (`ConfirmDialogComponent`). Montado uma vez em `ShellComponent` via `<app-confirm-dialog>`, igual o toast — não precisa importar em cada página.

```typescript
constructor(private confirm: ConfirmService) {}

async excluir(item: Item) {
  const confirmado = await this.confirm.confirmar(
    `Excluir "${item.nome}"?`,
    'Essa ação não pode ser desfeita.',
    { textoConfirmar: 'Excluir' }
  );
  if (!confirmado) return;

  // ação real...
}
```

- `confirmar(titulo, mensagem?, opcoes?)` retorna `Promise<boolean>` — método chamador vira `async`.
- Título é a pergunta ("Liberar essa lista?"), mensagem explica a consequência real (o que muda pra terceiros, se é reversível). Nunca só "Tem certeza?" sem contexto.
- `opcoes.textoConfirmar` troca o texto do botão pro verbo da ação ("Liberar", "Excluir") em vez do genérico "Confirmar" — deixa a intenção óbvia no botão.

## Por que não `window.confirm`/`alert`

Popup nativo do navegador quebra o layout (sem dark mode, sem estilo do app, trava a thread até o usuário responder) e não é reaproveitável. `ConfirmService`/`ToastService` resolvem isso e já estão plugados no shell — usar sempre eles.
