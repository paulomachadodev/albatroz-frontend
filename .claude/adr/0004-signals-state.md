# ADR-0004 — Signals para gerenciamento de estado (sem NgRx)

**Status:** Aceito  
**Data:** 2026-06-01  
**Número:** 0004

---

## Contexto

O ERP Albatroz frontend tem estado por página (filtros, seleções, dados carregados) e estado global limitado (usuário autenticado, tenant). Era necessário decidir entre uma solução de estado centralizada (NgRx Store) e uma abordagem mais simples baseada em reatividade nativa do Angular.

NgRx adiciona boilerplate significativo (actions, reducers, effects, selectors) que pode ser excessivo para um ERP onde a maioria do estado é por página e de vida curta.

---

## Decisão

Adotamos **Angular Signals** (`signal`, `computed`, `effect`) como única solução de estado, sem NgRx.

- Estado de página: `signal()` e `computed()` locais no smart component.
- Estado global (usuário, tenant): `signal()` em services `providedIn: 'root'`.
- Operações assíncronas: `HttpClient` direto no service retornando `Observable`, consumido via `toSignal()` ou `subscribe()` no smart component.
- Sem RxJS complexo (sem `switchMap` em cadeia, sem `combineLatest` de múltiplos streams).

---

## Alternativas Consideradas

| Alternativa | Por que descartada |
|-------------|-------------------|
| NgRx Store | Boilerplate excessivo para o volume de estado atual; complexidade injustificada |
| NgRx SignalStore | Mais leve, mas ainda adiciona abstração desnecessária para o tamanho do projeto |
| RxJS BehaviorSubject em services | Funciona, mas Signals são mais simples, síncronos e integrados ao Angular 19 |
| Akita / NGXS | Dependências adicionais sem vantagem clara para o perfil do projeto |

---

## Consequências

**Positivas:**
- Zero boilerplate de store — estado declarado onde é usado.
- `computed()` é lazy e memoizado — sem recálculos desnecessários.
- `effect()` substitui a maioria dos `subscribe()` manuais.
- Integração nativa com Change Detection do Angular (zoneless-ready).

**Negativas / Trade-offs:**
- Sem DevTools de estado (Redux DevTools) — debugging de estado mais manual.
- Se o projeto crescer significativamente, pode ser necessário migrar para SignalStore.
- Desenvolvedores com background NgRx precisam adaptar o modelo mental.

**Ações decorrentes:**
- Nenhum pacote NgRx deve ser adicionado sem ADR específico justificando.
- Estado que precisa ser compartilhado entre rotas vai em service `providedIn: 'root'` com `signal()`.
