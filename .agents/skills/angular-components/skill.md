---
name: angular-components
description: Padrão de componentes Angular com Signals (input, output, computed, effect). Dumb vs Smart components, lifecycle, templates.
---

# Angular Componentes — Signals Pattern

## Tipos de Componentes

**Dumb Component** (apresentação):
- Recebe dados via `input()`
- Emite eventos via `output()`
- Sem serviços, sem lógica

**Smart Component** (página):
- Gerencia estado (signals, observables)
- Chama serviços
- Orquestra componentes dumb

## Padrão Básico

```typescript
import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-usuario-card',
  template: `
    <div class="card">
      <h3>{{ nomeFormatado() }}</h3>
      <button (click)="usuarioSelecionado.emit(usuario())">
        Selecionar
      </button>
    </div>
  `,
  styleUrls: ['./usuario-card.component.scss']
})
export class UsuarioCardComponent {
  // Input obrigatório
  readonly usuario = input.required<Usuario>();
  
  // Input com default
  readonly desabilitado = input<boolean>(false);
  
  // Output (evento)
  readonly usuarioSelecionado = output<Usuario>();
  
  // Computed (derivado, auto-atualiza)
  readonly nomeFormatado = computed(() =>
    this.usuario().nome.toUpperCase()
  );
}
```

## Smart Component com Signals

```typescript
import { Component, signal, computed, effect, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, debounceTime } from 'rxjs/operators';

export class UsuariosPageComponent {
  private readonly service = inject(UsuariosService);

  // Estado
  filtro = signal('');
  pagina = signal(1);
  
  // Observable → Signal
  usuarios = toSignal(
    toObservable(this.filtro).pipe(
      debounceTime(300),
      switchMap(f => this.service.buscar(f))
    ),
    { initialValue: [] }
  );

  // Computed
  usuariosAtivos = computed(() =>
    this.usuarios().filter(u => u.Ativo)
  );

  // Effect (só no constructor)
  constructor() {
    effect(() => {
      console.log('Filtro mudou:', this.filtro());
      // analytics, tracking, etc
    });
  }

  buscar(novoFiltro: string) {
    this.filtro.set(novoFiltro);
  }

  proximaPagina() {
    this.pagina.update(p => p + 1);
  }
}
```

## Signals: input(), output(), computed()

```typescript
// Input — dados chegam de pai
readonly usuario = input.required<Usuario>();
readonly desabilitado = input<boolean>(false);

// Output — emitir eventos para pai
readonly usuarioSelecionado = output<Usuario>();
readonly onDelete = output<number>();

// Computed — valor derivado, auto-atualiza
readonly total = computed(() =>
  this.itens().reduce((acc, i) => acc + i.valor, 0)
);

// Signal state (manutenção interna)
dados = signal<Data[]>([]);

// Atualizar sempre com update() ou set()
this.dados.update(lista => [...lista, novoItem]);  // ✅
// NUNCA: this.dados().push(novoItem);  // ❌ mutação
```

## Effect (Efeitos Colaterais)

```typescript
export class Component {
  filtro = signal('');
  
  constructor() {
    // ✅ Effect SEMPRE no constructor
    effect(() => {
      const f = this.filtro();
      console.log('Filtro mudou:', f);
      // buscar dados, analytics, logging
    });
  }

  ngOnInit() {
    // ❌ NUNCA effect aqui
    // effect(() => { ... }) // ERRADO
  }
}
```

## Template — Control Flow Novo

```html
<!-- ✅ Angular 19 -->
@if (usuario) {
  <p>{{ usuario.nome }}</p>
}

@for (item of itens(); track item.id) {
  <div>{{ item.nome }}</div>
}

@switch (status()) {
  @case ('ativo') { <span>Ativo</span> }
  @case ('inativo') { <span>Inativo</span> }
  @default { <span>?</span> }
}

<!-- ❌ Antigo (nunca use) -->
<p *ngIf="usuario">{{ usuario.nome }}</p>
<p *ngFor="let item of itens">{{ item.nome }}</p>
```

## Injetar Dependências — `inject()`

```typescript
// ✅ CORRETO
export class UsuariosComponent {
  private readonly service = inject(UsuariosService);
  private readonly router = inject(Router);
}

// ❌ ERRADO
export class UsuariosComponent {
  constructor(private service: UsuariosService) { }
}
```

## Restrições

- **Max 400 linhas** — cabe na tela
- **Sem @Input/@Output antigos** — usar `input()`/`output()`
- **Sem lógica no template** — computed tudo no `.ts`
- **Template em arquivo separado** (`.component.html`)
- **Sem JSDoc** — nomes auto-explicativos
- **Effect só no constructor** — antes de qualquer outra coisa

## Exemplo Completo — Dumb Component

```typescript
@Component({
  selector: 'app-usuario-item',
  template: `
    <div class="item">
      <strong>{{ usuario().Nome }}</strong>
      <p>{{ usuario().Email }}</p>
      <button 
        [disabled]="desabilitado()"
        (click)="onEdit.emit(usuario())">
        Editar
      </button>
      <button 
        [disabled]="desabilitado()"
        (click)="onDelete.emit(usuario().Id)">
        Remover
      </button>
    </div>
  `,
  styleUrls: ['./usuario-item.component.scss']
})
export class UsuarioItemComponent {
  readonly usuario = input.required<UsuarioResponse>();
  readonly desabilitado = input<boolean>(false);
  
  readonly onEdit = output<UsuarioResponse>();
  readonly onDelete = output<number>();
}
```

## Ciclo de Vida

Regra: **propriedades e variáveis instanciadas no `ngOnInit()`** — exceto signals, que são declarados inline por exigência do Angular.

```typescript
export class UsuariosComponent implements OnInit, OnDestroy {
  // ✅ Signals: declarados inline (obrigatório para reatividade)
  filtro = signal('');
  pagina = signal(1);
  readonly total = computed(() => this.itens().length);

  // ✅ Variáveis não-signal: instanciadas no ngOnInit
  usuarios: UsuarioResponse[] = [];
  titulo!: string;

  constructor() {
    // Apenas effects — nada mais
    effect(() => {
      console.log('Filtro:', this.filtro());
    });
  }

  ngOnInit() {
    // ✅ Instanciar variáveis e buscar dados aqui
    this.titulo = 'Lista de Usuários';
    this.usuarios = [];
    this.carregarDados();
  }

  ngOnDestroy() {
    // cleanup (se necessário com Observables manuais)
  }
}
```

## Interop: Signal ↔ Observable

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Observable → Signal
const dados = toSignal(this.service.buscar(), { initialValue: [] });

// Signal → Observable
const filtro = signal('');
const filtro$ = toObservable(filtro);

// Combinar
resultado$ = toObservable(this.filtro).pipe(
  switchMap(f => this.service.buscar(f))
);
```
