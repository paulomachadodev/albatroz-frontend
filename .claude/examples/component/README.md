# Exemplo — Dumb Component

Exemplo canônico de componente apresentacional com Signals API moderna.

**Fonte:** `src/app/contextos/financeiro/cartoes/categoria-select/categoria-select.component.ts`

```typescript
@Component({
  selector: 'app-categoria-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-select.component.html'
})
export class CategoriaSelectComponent {
  private host = inject(ElementRef<HTMLElement>);

  // Inputs via signals API (Angular 17+)
  categorias = input<CategoriaDespesa[]>([]);
  value      = model<number | undefined>(undefined);  // two-way binding
  criar      = output<string>();

  // Estado interno
  aberto = signal(false);
  busca  = signal('');

  // Derivados
  selecionada = computed(() =>
    this.categorias().find(c => c.id === this.value())
  );

  filtradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) return this.categorias();
    return this.categorias().filter(c => c.nome.toLowerCase().includes(termo));
  });

  podeCriar = computed(() => {
    const termo = this.busca().trim();
    if (!termo) return false;
    return !this.categorias().some(c => c.nome.toLowerCase() === termo.toLowerCase());
  });

  selecionar(cat: CategoriaDespesa) {
    this.value.set(cat.id);
    this.fechar();
  }

  criarNova() {
    const termo = this.busca().trim();
    if (!termo) return;
    this.criar.emit(termo);
    this.fechar();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (this.aberto() && !this.host.nativeElement.contains(e.target)) this.fechar();
  }
}
```

**Padrões ilustrados:**

- `inject()` para dependências — nunca constructor em componentes novos
- `input<T>(default)` — substitui `@Input()`, tipado e signal-based
- `model<T>()` — two-way binding signal (substitui `@Input()` + `@Output() change`)
- `output<T>()` — substitui `@Output() new EventEmitter<T>()`
- `computed()` para derivações — nunca recalcular em getters ou template expressions complexas
- `@HostListener` para eventos globais (click outside) — componente gerencia próprio ciclo
- Sem lógica HTTP — componente puramente apresentacional
