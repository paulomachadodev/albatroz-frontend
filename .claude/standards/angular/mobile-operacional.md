# Telas mobile operacionais (bipagem, campo, chão de loja)

Padrão pra telas full-screen usadas em campo — bipagem de código de barras, contagem guiada, qualquer fluxo onde o usuário está em pé, no celular, olhando produto físico. Diferente de listagem/formulário administrativo (ver `listagem-padrao.md`).

## Trava de scroll obrigatória em todo overlay full-screen

Todo componente `fixed inset-0` que cobre a tela inteira (leitor de código de barras, overlay de quantidade, qualquer modal de captura de dado em campo) **trava o scroll do body enquanto estiver montado** — sem isso, um toque acidental fora do overlay rola a página por trás, e em iOS/Android isso costuma "vazar" um pedacinho do conteúdo de trás visível no rebote do scroll.

Usar `ScrollLockService` (`shared/services/scroll-lock.service.ts`) — é referência-contada (`travar()`/`destravar()` com contador interno), então overlays aninhados (ex: leitor de código dentro de um fluxo que já tem outro travamento) não brigam entre si desligando a trava um do outro:

```typescript
constructor(private scrollLock: ScrollLockService) {
  this.scrollLock.travar();
}

ngOnDestroy() {
  this.scrollLock.destravar();
}
```

Regra de ouro: **trava no `constructor` (ou `ngOnInit`), destrava no `ngOnDestroy`** — nunca condicional a um input booleano dentro de um componente que já fica sempre montado (isso é papel do `effect()` só quando o componente em si não é destruído ao fechar, como `app-drawer` — ver `listagem-padrao.md`). Componente `@if`-gated pela tela pai (destruído de verdade ao fechar) usa sempre o par constructor/ngOnDestroy.

Achado real (2026-09-16): `LeitorCodigoBarrasComponent` e o antigo `ContagemBipagemComponent` eram full-screen há tempos sem nenhuma trava — corrigido junto com a criação desse padrão, não esperar acumular mais tela sem trava antes de aplicar aqui.

## Tamanho de fonte — nunca `text-xs`/`text-sm` pra dado operacional

Tela administrativa (listagem, filtro) pode usar `text-xs`/`text-sm` à vontade — é lida sentado, perto da tela. Tela operacional é lida em pé, às vezes com luz de loja ruim, então:

- Dado que a pessoa precisa **ler rápido pra agir** (código do produto, nome, quantidade, código de barras) — mínimo `text-base`, preferir `text-lg` pro valor principal (ex: nome do produto no card-alvo da bipagem).
- Rótulo/legenda secundária (label de campo, contador "X restantes") pode ficar em `text-sm`, nunca menor que isso em tela operacional.
- Nunca `text-xs` pra nada que carregue informação de decisão (quantidade, código) — reservado só pra metadado descartável (timestamp discreto, por exemplo).

## Imagem pequena, nunca hero

Tela operacional não é vitrine — se mostrar imagem do produto (opcional, não obrigatório), é sempre thumbnail pequeno (ex: `size-16`/`size-24`), nunca ocupando a largura da tela. O espaço vertical em mobile é escasso e a prioridade visual é o dado textual (código/quantidade), não a foto.

## Nunca rolagem horizontal — nem em tela nenhuma, mobile ou web

Nenhuma tela do sistema tem rolagem horizontal, em nenhum breakpoint. Causa mais comum: `<table>` HTML solta sem `overflow-x-auto` em container estreito, ou texto sem `truncate`/`min-w-0` dentro de um flex item. Em tela alcançável por mobile, nunca usar `<table>` puro — listar como linhas empilhadas (`div` com `flex`/`space-y`), igual ao padrão `linhaMobile` já usado em `app-listagem-paginada`. `<table>` só é aceitável em tela 100% desktop (`hidden md:block`, nunca alcançada por rota mobile).

Achado real (2026-09-16): `contagem-sessoes-lista` (alcançável via Balanço a Efetivar no mobile) tinha uma `<table>` de 3 colunas pro detalhe de itens — trocada por linhas `flex` empilhadas.

## Rolagem vertical só quando a tela realmente lista algo de tamanho variável

Tela de escolha/menu (poucos botões, cards fixos) deve caber na viewport sem rolagem vertical sempre que der — não adicionar padding/espaçamento generoso a ponto de estourar a tela em aparelhos menores. Tela que lista resultado de busca/paginação (tamanho variável, não dá pra prever) pode rolar verticalmente normalmente — isso não é bug, é esperado.

## Exemplo de referência

`guiada-bipagem` (`contextos/balanco/pages/guiada-bipagem/`) é a implementação de referência desse padrão: card-alvo com fonte grande, barra de progresso, overlay de quantidade travando scroll, sem imagem hero.
