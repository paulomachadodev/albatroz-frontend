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

## `app-th-ordenavel` — cabeçalho de coluna ordenável

`shared/components/th-ordenavel/` — helper visual pra ordenação por coluna, pensado pra ser usado DENTRO do `<th>` que a própria tela já projeta em `#cabecalho` do `app-listagem-paginada`. O `app-listagem-paginada` em si não muda nada — ele não sabe (e não precisa saber) quais colunas são ordenáveis, isso é decisão de cada tela.

```html
<ng-template #cabecalho>
  <tr>
    <th>
      <app-th-ordenavel campo="protocolo" [ordenacaoAtual]="ordenacaoAtual()" (ordenar)="aoOrdenar($event)">
        Protocolo
      </app-th-ordenavel>
    </th>
    <th>Nome</th> <!-- coluna sem ordenação: th normal, sem o componente -->
  </tr>
</ng-template>
```

```typescript
ordenacaoAtual = signal<Ordenacao | null>(null);

aoOrdenar(ordenacao: Ordenacao) {
  this.ordenacaoAtual.set(ordenacao);
  this.paginaAtual.set(1);
  this.carregar();
}
```

- `campo`: chave lógica da coluna (nome do campo que o backend espera pra ordenar).
- `ordenacaoAtual`: `{ campo, direcao: 'asc'|'desc' } | null` — a tela é dona do estado, o componente só reflete visualmente.
- `(ordenar)`: emite a nova ordenação no clique; a tela decide o que fazer (geralmente recarregar a página 1 com o novo `sort`).
- Ícone `material-symbols-outlined`: `unfold_more` (não ordenado), `arrow_upward`/`arrow_downward` (ordenado). Clique alterna asc → desc → asc (2 estados, sem voltar pra "não ordenado" depois do primeiro clique).
- Colunas que não devem ser ordenáveis continuam `<th>` normal, sem o componente — 100% opt-in, não muda nenhuma tela existente que não usa.

## Container de página — sempre `w-full`, nunca `max-w-*`

O `<div>` logo abaixo do wrapper `flex-1 overflow-y-auto` (que segura breadcrumb + `app-page-header` + conteúdo) é sempre `class="w-full space-y-8"`. Nunca adicionar `max-w-3xl`/`max-w-*` nele — isso empurra o card pra esquerda e deixa a tela com sobra de espaço em branco, fora do padrão das outras telas de administração (`usuarios-lista`, `perfis-lista`). Se um formulário específico precisar de largura menor, limitar a largura no elemento do formulário em si (dentro do card), não no container da página.

## Ações da linha (tabela de listagem)

Botão de ação na última coluna (`text-right`) segue sempre o mesmo estilo, incluindo ações que desativam/bloqueiam (`Inativar`, `Bloquear`):

```html
<button (click)="acao(item)" class="text-xs font-bold text-primary hover:underline">Rótulo</button>
```

Cor vermelha (`text-red-600`/`text-rose-600`) é reservada só pra exclusão definitiva de registro (ver `lista-detalhe`/`categoria-modal`), nunca pra inativar/bloquear — essas são reversíveis e usam `text-primary`, igual `usuarios-lista` (`Bloquear`/`Desbloquear`).

Link de texto é pra **1 ação só** por linha/card. A partir de 2 ações no mesmo lugar (célula de tabela, card de item, etc.), usa `app-btn-icone` (abaixo) — link de texto empilhado/lado-a-lado com outro não é o padrão.

## `app-btn-icone` — botão quadrado de ação (2+ ações no mesmo lugar)

`shared/components/btn-icone/` — quadrado `w-8 h-8 rounded-lg`, ícone `material-symbols-outlined` centralizado, pensado pra agrupar múltiplas ações compactas onde um link de texto não cabe (card de imagem, célula de ação com mais de 1 botão).

```html
<div class="flex gap-1">
  <app-btn-icone icone="delete" titulo="Excluir" variante="perigo" (clicar)="excluir(item)"></app-btn-icone>
  <app-btn-icone icone="star" titulo="Tornar capa" (clicar)="tornarCapa(item)"></app-btn-icone>
</div>
```

`variante`: `neutro` (padrão, cinza) | `perigo` (vermelho — mesma regra de cor acima: só pra ação destrutiva/irreversível). `titulo` vira `title` do `<button>` (tooltip nativo, sem texto visível). `desabilitado` desabilita e aplica opacidade.

**Não usar `[class.algo/com-barra]` nem `[class.dark:hover:algo]`** em nenhum componente Angular — o parser de template (`NG5002`) não aceita `/` nem `:` extra dentro do binding `[class.X]`. Pra classe condicional com esses caracteres (opacidade Tailwind `bg-primary/5`, variantes `dark:hover:`), usa `[class]="condicao ? 'classes...' : 'outras...'"` (string inteira, não binding por classe individual) — ver exemplo em `btn-icone.component.html`.

Ainda não migrado (não é regressão, é lacuna): `produtos-lista` não tem coluna de ações — a linha inteira navega pro detalhe no click. Quando a tela ganhar ações rápidas (ex: excluir sem abrir detalhe), usar `app-btn-icone` desde o início, não link de texto.

## `app-toggle` — liga/desliga (nunca checkbox cru pra isso)

`shared/components/toggle/` — switch estilo slider (`role="switch"`, bolinha desliza), não é `<input type="checkbox">` estilizado. Único componente aceito pra qualquer liga/desliga binário do sistema (habilitar/desabilitar produto num marketplace, ativo/inativo, etc.) — nunca criar checkbox cru pra isso, nem outro switch do zero.

```html
<app-toggle [valor]="produto.habilitado" [label]="'Habilitado'" [desabilitado]="salvando()"
            (valorMudou)="aoAlternar($event)"></app-toggle>
```

`valor`/`label`/`desabilitado` são inputs; `valorMudou` emite o novo booleano no clique — a tela decide se isso dispara request imediato (ação de lista, como os itens de lista escolar) ou só marca estado sujo (campo de formulário atrás do botão Salvar, ver seção acima).

## `app-campo-hint` — explicação de campo (balãozinho "?")

`shared/components/campo-hint/` — bolinha "?" ao lado do label, mostra explicação num popover só no hover/click. Padrão obrigatório pra qualquer explicação de campo que hoje vira texto solto embaixo do input — o label do campo fica curto (nome só), a explicação (regra, formato esperado, o que acontece) vai pro hint, não pro corpo do form.

```html
<label class="text-xs font-bold text-slate-500 uppercase tracking-wide inline-flex items-center gap-1">
  Percentual
  <app-campo-hint texto="Positivo = acréscimo, negativo = desconto. Aplicado sobre o preço de venda ou custo, conforme o Cálculo escolhido acima."></app-campo-hint>
</label>
```

## `app-menu-dropdown` — botão com submenu (ações em massa, ações agrupadas)

`shared/components/menu-dropdown/` — botão primário com seta que abre uma lista de ações relacionadas. Usa quando o `acoes` do `app-page-header` teria 3+ botões que fariam mais sentido agrupados (ex: "Ações em massa" reunindo Importar, Exportar, Alterar em massa) em vez de um botão por ação disputando espaço no header.

```html
<app-page-header titulo="Produtos" subtitulo="...">
  <app-menu-dropdown acoes>
    <span rotulo>Ações em massa</span>
    <div itens>
      <button type="button" (click)="acao()" class="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <span class="material-symbols-outlined text-base">upload_file</span>
        Rótulo da ação
      </button>
      <!-- item desabilitado ("em breve"): mesma estrutura trocando <button> por <div class="... text-slate-400 cursor-not-allowed">, sem (click) -->
    </div>
  </app-menu-dropdown>
</app-page-header>
```

Não usar pra 1-2 ações — aí o botão único (padrão antigo, ver exemplo no topo do arquivo) continua mais direto.

## `app-overlay-progresso` — bloqueio de tela em operação demorada

`shared/components/overlay-progresso/` — tela toda escurecida (`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]`) com ícone giratório grande + mensagem, trava interação (nada por trás é clicável, cobre até o header). Usa em qualquer sequência de requests que demore (upload de várias imagens, confirmação de lote) — sem isso o usuário não sabe se a ação está rodando.

```html
<app-overlay-progresso [visivel]="enviando()" mensagem="Enviando imagens..."
                        [concluidas]="feitas()" [total]="totalArquivos()"></app-overlay-progresso>
```

`concluidas`/`total` são opcionais — se `total` for 0 (padrão), some o contador "X/Y (Z%)" e mostra só o spinner+mensagem (bom pra operação de request único tipo confirmar um lote, sem sub-etapas pra contar).

**Não confundir** com `app-spinner` (inline, pequeno, não bloqueia nada) nem com o ícone giratório usado em `login`/`lista-detalhe` (mesmo ícone `progress_activity`, mas sem o backdrop/bloqueio — aquele é decoração inline, este é modal de bloqueio).

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

**Achado 2026-08-21**: essa regra vale mesmo quando o registro editado tem várias seções/abas dentro da mesma tela (ex: produto com abas Complementos/Web/Fornecedores). É **1 botão Salvar pro registro inteiro** (ex: "Concluir edição" no topo), não 1 por seção/aba — vira exatamente o autosave-disfarçado que essa regra proíbe se cada bloco tiver o próprio "Salvar". Exceção: ações de lista que já são atômicas por natureza (adicionar/remover/marcar principal um item de uma coleção, tipo fornecedor de produto ou imagem) continuam efetivando na hora, como sempre foi — a regra é sobre campo de formulário, não sobre ação de lista.

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
