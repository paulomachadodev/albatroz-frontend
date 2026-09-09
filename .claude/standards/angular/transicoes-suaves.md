# Transições — toda entrada/saída de overlay é suave, nunca abrupta

## Regra

Drawer, modal, dropdown, menu flyout, tooltip — qualquer elemento que aparece/some via `@if` — precisa de transição de entrada e saída. Nunca `@if` puro sem CSS de transição: o elemento não pode simplesmente aparecer/sumir no frame seguinte.

Incidente 2026-09-09: nenhum overlay do sistema (`modal`, `drawer`, `menu-dropdown`, `select-busca`, `select-busca-multi`, `colunas-configuraveis`) tinha transição — todos apareciam/sumiam instantâneos. Usuário reportou como "muito duro". Corrigido nessa leva.

## Padrão por tipo

**Modal** (centro da tela, com backdrop): fade no backdrop + fade+scale no conteúdo.
```html
@if (aberto()) {
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-[fade-in_150ms_ease-out]" (click)="fechar.emit()"></div>
    <div class="relative ... animate-[modal-in_150ms_ease-out]">...</div>
  </div>
}
```

**Drawer** (lateral, desliza): fade no backdrop + slide no painel.
```html
<div class="... animate-[drawer-in_200ms_ease-out]">...</div>
```

**Dropdown / flyout / menu de contexto** (aparece perto de um botão): fade + leve slide (8px) na direção de origem.
```html
<div class="... animate-[dropdown-in_150ms_ease-out]">...</div>
```

Keyframes ficam centralizados em `styles.scss`:
```css
@keyframes fade-in    { from { opacity: 0 } to { opacity: 1 } }
@keyframes modal-in   { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
@keyframes drawer-in  { from { opacity: 0; transform: translateX(16px) } to { opacity: 1; transform: translateX(0) } }
@keyframes dropdown-in{ from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
```

## Saída (fechar)

Angular `@if` desmonta o elemento na hora — sem `animate.leave` (Angular 19+) ou um `[class.fechando]` com `setTimeout`, não dá pra animar a saída de verdade. Pra manter simples: **priorizar a entrada suave sempre** (é o que mais se nota) e só investir em animação de saída onde o componente já tem um estado intermediário fácil de controlar (ex.: sidebar colB, que já tem `colBVisivel()` computed). Não vale complicar um componente simples só pra animar o fechamento.

## Onde já está aplicado

`sidebar.component.html` (coluna A largura, coluna B fade+slide), `modal.component`, `drawer.component`, `menu-dropdown.component`, `select-busca`/`select-busca-multi` (painel de resultado), `colunas-configuraveis` (drawer).

Toda vez que um componente novo abrir algo via `@if`, aplicar esse padrão antes de considerar pronto.
