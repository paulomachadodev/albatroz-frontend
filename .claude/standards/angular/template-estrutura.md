# Template de Página — Estrutura e Estilo

Padrão obrigatório pra toda tela nova (ou tela tocada de forma não-trivial). Cada seção tem o trecho HTML exato — copiar, não reinventar.

## Wrapper externo

Todo componente de página roteada usa esta casca. O host fica `flex-1 flex flex-col min-h-0`; o wrapper interno cuida do scroll e do padding responsivo.

```typescript
@Component({
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
```

```html
<div class="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
  <div class="w-full space-y-8">

    <app-breadcrumb [itens]="[{label:'Início',rota:'/dashboard'},{label:'Seção',rota:'/rota'},{label:'Tela'}]" />
    <app-page-header titulo="Título" subtitulo="Descrição curta da tela." />

    <!-- conteúdo da tela -->

  </div>
</div>
```

Nunca `max-w-*` no `<div class="w-full space-y-8">` — toda tela ocupa a largura disponível.

## Cores — tokens, nunca `blue-*` hardcoded

| Uso | Classe correta | Nunca usar |
|---|---|---|
| Botão primário | `bg-primary` | `bg-blue-600`, `bg-blue-500`, `bg-indigo-600` |
| Texto primário | `text-primary` | `text-blue-600` |
| Ring de foco | `focus:ring-primary/20` | `focus:ring-blue-200` |
| Border ativa (tabs) | `border-primary` | `border-blue-600` |

`bg-primary` é a cor de marca definida em `tailwind.config.js`. Usar `blue-*` hardcoded quebra o tema quando a cor de marca mudar.

## Botões

```html
<!-- primário -->
<button class="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
  Rótulo
</button>

<!-- secundário / cancelar -->
<button class="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
  Cancelar
</button>

<!-- ação inline na tabela (1 ação por linha) -->
<button class="text-xs font-bold text-primary hover:underline">Editar</button>

<!-- ação inline na tabela (2+ ações) → usar app-btn-icone (ver listagem-padrao.md) -->
```

## Abas (tabs)

```html
<nav class="flex items-center gap-6 border-b border-slate-200 dark:border-slate-700">
  <button (click)="trocarAba('geral')"
          class="pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap"
          [class.border-primary]="abaAtiva() === 'geral'"
          [class.text-primary]="abaAtiva() === 'geral'"
          [class.border-transparent]="abaAtiva() !== 'geral'"
          [class.text-slate-500]="abaAtiva() !== 'geral'">
    Geral
  </button>
  <!-- repetir para cada aba -->
</nav>
```

Nunca `border-blue-600` ou `text-blue-600` nos botões de aba — sempre `[class.border-primary]` / `[class.text-primary]`.

`[class.X/Y]` com barra e `[class.dark:hover:X]` com dois-pontos extras causam `NG5002` — usar `[class]="cond ? 'classes' : 'outras'"` quando a classe contiver `/` ou `:` extra (ver listagem-padrao.md → app-btn-icone).

## Cards e seções

```html
<div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
  <!-- conteúdo -->
</div>
```

## Inputs e selects

```html
<label class="text-xs font-semibold text-slate-500">Rótulo do campo</label>
<input type="text"
       class="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
```

## Modal

Sempre `<app-modal>`, nunca `<div class="fixed inset-0 z-50">` hand-rolled.

```html
<app-modal [aberto]="modalAberto()" titulo="Título do Modal" tamanho="md" (fechar)="fecharModal()">
  <div class="px-6 pb-6 flex flex-col gap-4">
    <!-- conteúdo -->
    <div class="flex items-center justify-end gap-2">
      <button (click)="fecharModal()" class="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancelar</button>
      <button (click)="confirmar()" class="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all">Confirmar</button>
    </div>
  </div>
</app-modal>
```

`tamanho`: `sm` (padrão) | `md` | `lg` | `2xl`.

## Tabelas sem paginação

Quando os dados não precisam de paginação (ex: lista limitada de resultados), ainda usar `<app-listagem-paginada>` com `[totalPaginas]="1"` — ganha loading state, empty state e estilo de tabela sem custo.

```html
<app-listagem-paginada
  [itens]="itens()"
  [carregando]="carregando()"
  [totalRegistros]="itens().length"
  [totalPaginas]="1"
  tituloVazio="Mensagem quando não há dados.">

  <ng-template #cabecalho>
    <tr>
      <th class="px-6 py-4">Coluna</th>
    </tr>
  </ng-template>

  <ng-template #linha let-item>
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="px-6 py-4">{{ item.campo }}</td>
    </tr>
  </ng-template>
</app-listagem-paginada>
```

## Status badges

```html
<!-- verde -->
<span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Ativo</span>

<!-- âmbar -->
<span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Pendente</span>

<!-- vermelho -->
<span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Cancelado</span>

<!-- cinza -->
<span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Rascunho</span>
```

## Ícone de carregamento inline (spinner de ação)

```html
<span class="material-symbols-outlined text-base animate-spin">progress_activity</span>
```

Pra bloqueio de tela inteira em operação demorada → `<app-overlay-progresso>` (ver listagem-padrao.md).

## Referências

- Componentes `shared/`: `app-listagem-paginada`, `app-modal`, `app-page-header`, `app-breadcrumb`, `app-spinner`, `app-btn-icone`, `app-drawer`, `app-overlay-progresso` → ver `listagem-padrao.md`
- Patterns de formulário, autosave, drawer criar/editar → ver `listagem-padrao.md`
- PrimeNG first (selects, toggles) → ver `listagem-padrao.md` → PrimeNG first (ADR-0006)
