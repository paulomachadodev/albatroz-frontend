# Exemplo — Smart Component (Página)

Exemplo canônico de página com signals, computed e carregamento de dados.

**Fonte:** `src/app/contextos/financeiro/cartoes/cartoes-dashboard/cartoes-dashboard.component.ts`

```typescript
@Component({
  selector: 'app-cartoes-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CartaoModalComponent, CategoriaModalComponent],
  templateUrl: './cartoes-dashboard.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class CartoesDashboardComponent implements OnInit {
  // Estado
  cartoes    = signal<Cartao[]>([]);
  faturas    = signal<Fatura[]>([]);
  carregando = signal(true);

  // UI state
  mostrarModalCartao    = signal(false);
  cartaoEmEdicao        = signal<Cartao | null>(null);

  // Derivados via computed (nunca recalcular manualmente)
  todosCartoes = computed<Cartao[]>(() =>
    this.cartoes().flatMap(c => [c, ...(c.adicionais ?? [])])
  );

  totalGasto = computed(() =>
    this.faturas().filter(f => f.status !== 3).reduce((s, f) => s + f.valorTotal, 0)
  );

  percentualUso = computed(() => {
    const total = this.limiteTotalGlobal();
    return total > 0 ? (this.limiteUsadoGlobal() / total) * 100 : 0;
  });

  constructor(
    private cartoesService: CartoesService,
    private faturasService: FaturasService
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  private carregarDados() {
    this.carregando.set(true);
    this.cartoesService.listar().subscribe({
      next: res => {
        this.cartoes.set(res.dados ?? []);
        this.carregarFaturas();
      },
      error: () => this.carregando.set(false)
    });
  }

  abrirModalCartao(cartao?: Cartao) {
    this.cartaoEmEdicao.set(cartao ?? null);
    this.mostrarModalCartao.set(true);
  }

  fecharModalCartao(recarregar: boolean) {
    this.mostrarModalCartao.set(false);
    if (recarregar) this.carregarDados();
  }
}
```

**Padrões ilustrados:**

- `standalone: true` + `imports` explícitos — sem NgModule
- `host: { class: '...' }` — Tailwind no host element, não em wrapper div
- Sinais para estado mutável (`signal()`), derivações via `computed()` — nunca calcular inline no template
- `carregando = signal(true)` — estado de loading sempre sinalizado
- `subscribe({ next, error })` — sem `.pipe()` desnecessário para casos simples
- `res.dados ?? []` — fallback defensivo do `Resultado<T>`
- Callbacks de modal recebem `boolean` pra indicar se deve recarregar — evita acoplamento
- Constructor injection (legado); preferir `inject()` em código novo
