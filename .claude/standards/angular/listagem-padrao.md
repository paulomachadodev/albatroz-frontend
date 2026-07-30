# Listagem Padrão — Filtro + Tabela Paginada + Drawer

## `app-listagem-paginada`

Componente genérico em `shared/components/listagem-paginada/` que substitui a listagem manual (filtro + tabela + paginação) hand-rolled em cada tela.

Uso:

```html
<app-listagem-paginada
  [itens]="itens()"
  [carregando]="carregando()"
  [totalRegistros]="totalRegistros()"
  [paginaAtual]="paginaAtual()"
  [totalPaginas]="totalPaginas()"
  [tamanhoPagina]="tamanhoPagina()"
  tituloVazio="Nenhum registro encontrado"
  (paginaMudou)="carregar($event)"
  (tamanhoPaginaMudou)="aoMudarTamanhoPagina($event)">

  <div filtros class="grid ...">
    <!-- campos de filtro + botões Filtrar/Limpar, próprios de cada tela -->
  </div>

  <ng-template #cabecalho>
    <tr><th>...</th></tr>
  </ng-template>

  <ng-template #linha let-item>
    <tr><td>{{ item.campo }}</td></tr>
  </ng-template>

</app-listagem-paginada>
```

- `filtros` é um slot de projeção — o componente só renderiza o card externo, cada tela monta seus próprios campos.
- `#cabecalho` e `#linha` são `TemplateRef` projetados via `@ContentChild` — o componente cuida da estrutura `<table>`, do loading e do empty state.
- Use sempre que a tela for uma listagem com filtro + tabela + paginação Prev/Next. Não recriar esse shell manualmente.

## Tamanho de página

Padrão: opções `[10, 50, 100]`, default `10`.

Exceção documentada: `listas-lista` (Lista Escolar) mantém default `20` — tela já em produção antes desse padrão, evitando regressão de comportamento.

## Drawer vs. página separada

`app-drawer` (`shared/components/drawer/`) — painel lateral direito, mesmo padrão visual de overlay do `categoria-modal` (backdrop + blur), mas ancorado à direita e com scroll lock via `effect()`.

- **Use drawer** quando o registro editado é "flat" — poucos campos, sem sub-navegação ou coleções aninhadas (ex: Escola: nome/bairro/cidade/parceira).
- **Use página separada** quando o registro tem coleções aninhadas que precisam de espaço de tela real (ex: Lista Escolar tem `itens`, por isso `lista-detalhe` continua sendo página, não drawer).

## Autosave por campo

Padrão usado nos formulários dentro do drawer (e em telas de edição em geral, ver `lista-detalhe.component.ts`'s `aoDigitarBusca`):

- Debounce manual de ~600-800ms via `setTimeout`/`clearTimeout` — **nunca** RxJS `debounceTime` (idioma não usado nesse código-base).
- Toggle/checkbox salva imediato, sem debounce.
- Sem botão "Salvar" explícito — o autosave é o próprio salvamento.
- Sempre um botão "Cancelar" que fecha o drawer/tela E limpa qualquer debounce pendente (evita salvar depois de fechado).

```typescript
private debounceNome?: ReturnType<typeof setTimeout>;

aoDigitarNome(valor: string) {
  this.nome = valor;
  if (this.debounceNome) clearTimeout(this.debounceNome);
  this.debounceNome = setTimeout(() => {
    this.service.atualizar(this.id, { nome: valor.trim() }).subscribe(...);
  }, 700);
}

cancelar() {
  if (this.debounceNome) clearTimeout(this.debounceNome);
  this.fecharDrawer();
}
```

## Criação dentro de um drawer com autosave

Padrão estabelecido por Escolas: ao abrir o drawer em modo "criar", mostrar só o campo obrigatório mínimo (ex: Nome). O debounce desse campo dispara o `POST` de criação — não um botão "Criar". Assim que o registro existe, revelar os demais campos e trocar para autosave por `PATCH` normal (modo "editar").
