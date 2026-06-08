# Signals — State Management

Angular 19. Sem NgRx. Estado local via signals + computed.

## Regras Fundamentais

| Regra | ✅ Correto | ❌ Errado |
|---|---|---|
| Input | `input()` / `input.required()` | `@Input()` |
| Output | `output()` | `@Output() EventEmitter` |
| Derivados | `computed()` | getter simples |
| Efeitos colaterais | `effect()` no constructor | `ngOnInit`, `ngOnChanges` |
| Mutação | `.set()` / `.update()` | `array.push()`, mutação direta |
| Signal → Observable | `toObservable()` | — |
| Observable → Signal | `toSignal()` | `subscribe()` + assign |

## Declaração

```typescript
// Input de pai
readonly usuario = input.required<UsuarioResponse>();
readonly desabilitado = input<boolean>(false);

// Estado interno
carregando = signal(false);
lista = signal<ProdutoResponse[]>([]);

// Derivado (auto-atualiza)
readonly total = computed(() => this.lista().length);
readonly listaFiltrada = computed(() =>
  this.lista().filter(p => p.Ativo)
);
```

## Mutação Correta

```typescript
// ✅
this.lista.set([]);
this.lista.update(l => [...l, novoItem]);
this.carregando.set(true);

// ❌ — não dispara reatividade
this.lista().push(novoItem);
```

## Effect

```typescript
export class MeuComponent {
  filtro = signal('');

  constructor() {
    // Effect SEMPRE no constructor, ANTES de qualquer lógica
    effect(() => {
      const f = this.filtro();
      // side effect: analytics, log, storage
    });
  }
}
```

## toSignal / toObservable

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Observable → Signal (leitura reativa no template)
readonly produtos = toSignal(
  this.service.listar(),
  { initialValue: [] }
);

// Com pipe
readonly produtosFiltrados = toSignal(
  toObservable(this.filtro).pipe(
    debounceTime(300),
    switchMap(f => this.service.buscar(f))
  ),
  { initialValue: [] }
);
```

## Params de Rota como Signal

```typescript
private readonly route = inject(ActivatedRoute);

readonly id = toSignal(
  this.route.paramMap.pipe(map(p => Number(p.get('id')))),
  { initialValue: 0 }
);
```

## Sem NgRx

Estado global = signal em service `providedIn: 'root'`:

```typescript
@Injectable({ providedIn: 'root' })
export class SessaoService {
  readonly usuario = signal<UsuarioResponse | null>(null);
  readonly isAutenticado = computed(() => this.usuario() !== null);

  login(u: UsuarioResponse) { this.usuario.set(u); }
  logout() { this.usuario.set(null); }
}
```
