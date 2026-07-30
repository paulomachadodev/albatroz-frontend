# Listagem Padrão — Filtro + Tabela Paginada + Drawer

## Regra geral — checar `shared/components/` antes de criar UI nova

Antes de escrever markup de tabela, paginação, modal, drawer, cabeçalho de página ou spinner numa tela nova, checar `src/app/shared/components/` — se o padrão já existe lá, usar, nunca duplicar hand-rolled. Componentes disponíveis hoje: `listagem-paginada`, `drawer`, `modal`, `page-header`, `spinner`. Se a tela precisa de algo parecido mas não idêntico, preferir estender o componente existente (novo input) a criar um paralelo.

## `app-page-header`

`shared/components/page-header/` — substitui o bloco `<h1>título</h1><p>subtítulo</p>` + botão de ação que era copiado em toda tela de listagem.

```html
<app-page-header titulo="Cadastro de Escolas" subtitulo="Gerencie as escolas usadas nas listas.">
  <button acoes (click)="abrirCriar()">Nova Escola</button>
</app-page-header>
```

`acoes` é slot de projeção pro(s) botão(ões) de ação — cada tela é dona do próprio botão/lógica.

**Atenção display:** componente Angular sem `host: { class: 'block' }` renderiza como `display: inline` por padrão — se ele for filho direto de um container `space-y-*` (Tailwind), o `margin-top` que o `space-y-*` aplica não tem efeito em inline, e os cards colam um no outro. Todo componente novo em `shared/components/` que vai ser usado como bloco (não inline, como o `spinner` que às vezes fica dentro de botão) precisa declarar `host: { class: 'block' }` no `@Component`.

## `app-modal`

`shared/components/modal/` — modal centralizado (backdrop + painel), substitui os backdrops hand-rolled que existiam em cada `*-modal.component.html` de `financeiro/cartoes/`.

```html
<app-modal [aberto]="true" titulo="Categorias de despesa" tamanho="sm" (fechar)="fechar.emit()">
  <!-- conteúdo do modal -->
</app-modal>
```

`tamanho`: `sm | md | lg | 2xl` (mapeia pra `max-w-*`). Se `titulo` não for passado, o componente não renderiza cabeçalho — a tela pode montar o próprio header customizado como conteúdo projetado. Clique no backdrop fecha (emite `fechar`); sem Escape-to-close (nenhum dos modais originais tinha).

## `app-spinner`

`shared/components/spinner/` — substitui os `<div class="animate-spin border-...">` hand-rolled. `tamanho`: `sm | md | lg`. `label` opcional (texto ao lado). `[claro]="true"` quando o spinner fica sobre fundo colorido (ex: dentro de botão primário) — troca a cor da borda pra branco em vez da cor padrão.

Não migrar o padrão de ícone giratório (`<span class="material-symbols-outlined animate-spin">progress_activity</span>`, usado em `login`/`esqueci-senha`/`lista-detalhe`) pra esse componente — é um padrão visual diferente (ícone, não borda), documentado aqui só pra não confundir os dois na hora de escolher.

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
