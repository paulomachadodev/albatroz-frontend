# Carregamento de página — a tela só aparece quando tudo estiver carregado

## Regra

Toda tela do sistema abre **completa**. O usuário nunca vê cards vazios, tabela em branco, gráfico montando ou números pulando. Enquanto a navegação e as chamadas iniciais da tela não terminam, o shell cobre a área de conteúdo com o loader (`app-carregando-pagina`, spinner grande sobre o fundo da tela). Só depois a tela é liberada, com fade.

Incidente 2026-11-20: o dashboard do administrador abria logo após o login com os cards ainda carregando. Decidido pelo usuário: vale para todas as telas atuais e futuras, é sinal de profissionalismo.

## Como funciona (já pronto, automático)

- `CarregamentoPaginaService` (`core/carregamento`) abre uma janela a cada navegação do router (inclui o login → dashboard e o F5).
- `carregamentoPaginaInterceptor` conta toda requisição HTTP disparada dentro da janela.
- A janela fecha quando a navegação termina, não há requisição pendente e passaram 150 ms sem nova requisição (cobre chamada encadeada). Trava de segurança de 20 s: depois disso a tela é liberada mesmo com requisição pendurada.
- `ShellComponent` renderiza `<app-carregando-pagina>` sobre o `<router-outlet>`. Não colocar outro loader de tela cheia dentro das páginas.

Não precisa fazer nada na tela para ela herdar o comportamento, desde que **as chamadas iniciais saiam no `ngOnInit`/construtor** (ou em `effect` logo ao abrir). Requisição disparada depois (clique, filtro, paginação, scroll, polling) não aciona o loader de página.

## O que a tela nova deve fazer

1. Carregar os dados iniciais no `ngOnInit`, em paralelo (`forkJoin`/chamadas simultâneas), nunca em cascata evitável com `setTimeout`.
2. Não usar `setTimeout`/`debounce` para disparar a primeira carga: a janela pode fechar antes. Se a primeira chamada depende de outra, encadear no `next` da anterior (a espera de 150 ms cobre o encadeamento imediato).
3. Recarga dentro da tela (filtro, ordenação, página, granularidade) mostra o estado local da própria tela (`carregando` do componente, skeleton ou `Carregando...` da listagem). Isso continua valendo e não é substituído pelo loader de página.
4. Polling e atualização em segundo plano usam o contexto `SEM_CARREGAMENTO_DE_PAGINA` quando a primeira chamada ocorre na abertura:
   ```ts
   this.http.get(url, { context: new HttpContext().set(SEM_CARREGAMENTO_DE_PAGINA, true) })
   ```
5. Dado secundário e pesado que não deve segurar a abertura (ex.: relatório lento num cartão opcional) pode ser pedido depois de uma ação do usuário ou com o contexto acima, com skeleton no cartão. Decisão consciente, dita na resposta.
6. Telas fora do shell (login, landing, páginas públicas) não têm o overlay; elas mostram o estado de envio no botão.

## Checagem

- Abrir a tela com a rede lenta (DevTools → Slow 4G): nada de card vazio ou número mudando depois que o loader some.
- Abrir direto pela URL (F5) e pelo login.
- Se a tela dispara requisição em `setTimeout`, `interval` ou depois de renderizar, tratar conforme o item 2 ou 4.
