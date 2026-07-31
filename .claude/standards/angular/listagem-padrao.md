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

## Botão Salvar explícito (padrão atual — 2026-07-31)

Decisão do usuário: **nenhum CRUD novo/tocado usa autosave**. Formulário (drawer ou página) acumula as mudanças em memória e só grava no `POST`/`PATCH` quando o usuário clica em **Salvar**.

- Botão "Salvar" sempre visível no rodapé do drawer/form, desabilitado enquanto o form for inválido ou uma request estiver em andamento.
- Botão "Cancelar" descarta as mudanças em memória e fecha o drawer/tela — sem chamada de API.
- Nada de `setTimeout`/`debounce` disparando save sozinho, nem toggle salvando imediato — toggle também só entra no payload do Salvar.
- Vale para criar e editar igual — ver seção "Drawer único criar/editar" abaixo.

```typescript
salvando = signal(false);

salvar() {
  this.salvando.set(true);
  const payload = { nome: this.nome, ativo: this.ativo, parceira: this.parceira };
  const request = this.modo() === 'criar'
    ? this.service.criar(payload)
    : this.service.atualizar(this.id()!, payload);

  request.subscribe({
    next: () => { this.salvando.set(false); this.fecharDrawer(); this.recarregar(); },
    error: () => this.salvando.set(false)
  });
}

cancelar() {
  this.fecharDrawer(); // sem side-effect de rede
}
```

**Migração:** telas antigas construídas com autosave por campo (debounce `setTimeout`) continuam funcionando como estão — não é pra sair reescrevendo tudo de uma vez. Auditoria completa de migração está em backlog (`.claude/contexts/projeto/backlog-autosave.md`). Toda tela **nova** ou **tocada** por uma mudança não-trivial já nasce/migra pro botão Salvar.

## Drawer único criar/editar

Reaproveitar o mesmo drawer/form pros modos "criar" e "editar" — não duplicar componente. O form mostra **todos os campos de uma vez** (nada de campo mínimo primeiro e revelar o resto depois, esse padrão de autosave-progressivo foi abandonado). O que muda entre os dois modos é só:

- Título do drawer ("Nova Escola" vs "Editar Escola")
- Estado inicial do form (vazio/default vs pré-preenchido com o registro)
- A chamada feita no Salvar (`criar()` vs `atualizar(id)`)

```typescript
modo = signal<'criar' | 'editar'>('criar');
registroEmEdicao = signal<Escola | null>(null);

abrirCriar() {
  this.modo.set('criar');
  this.registroEmEdicao.set(null);
  this.resetForm();
  this.drawerAberto.set(true);
}

abrirEditar(escola: Escola) {
  this.modo.set('editar');
  this.registroEmEdicao.set(escola);
  this.preencherForm(escola);
  this.drawerAberto.set(true);
}
```

## Filtros populados — dropdown com busca (padrão atual — 2026-07-31)

Todo filtro cujo valor vem de uma lista de opções do backend (escola, série, status vindo de tabela, etc.) deve ser um **select com busca embutida** (searchable combobox/autocomplete) — nunca um `<input>` de texto livre torcendo pra bater com ILIKE no backend, e nunca um `<select>` HTML simples quando a lista de opções pode crescer (dezenas+).

- Fonte das opções: endpoint dedicado do domínio (ex: `GET /cotacao/listas-escolares/filtros/escolas?termo=`), **não** o cadastro inteiro — o filtro só deve oferecer valores que realmente existem no recorte listado (ex: só escolas que têm ao menos 1 lista cotada), não todo o cadastro mestre.
- Componente: usar/criar um `app-select-busca` genérico em `shared/components/` (mesma lógica de reuso do `app-listagem-paginada`) — digita, debounce ~300ms, chama o endpoint, mostra resultados num dropdown, seleciona um item, guarda o `id`.
- Filtro de texto livre continua OK só quando o campo é realmente texto livre no domínio (não vem de uma lista fechada de opções).
