# Forms — Reactive Forms Pattern

## Regras

- Reactive Forms (`FormBuilder`) — nunca Template-driven
- `inject(FormBuilder)` — nunca constructor
- Validação no `.ts` — nunca só no template
- Submit via método — nunca `(submit)` direto no template
- Estado de loading com signal durante submit

## Estrutura Base

```typescript
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="salvar()">
      <input formControlName="Nome" />
      @if (form.get('Nome')?.invalid && form.get('Nome')?.touched) {
        <span>Nome obrigatório</span>
      }
      <button type="submit" [disabled]="form.invalid || salvando()">
        {{ salvando() ? 'Salvando...' : 'Salvar' }}
      </button>
    </form>
  `
})
export class ProdutoCadastroPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProdutosService);
  private readonly router = inject(Router);

  salvando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.group({
    Nome:      ['', [Validators.required, Validators.maxLength(100)]],
    Preco:     [0,  [Validators.required, Validators.min(0)]],
    Descricao: ['']
  });

  salvar() {
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    const request = new ProdutoCriarRequest(this.form.getRawValue());

    this.service.criarProduto(request).subscribe({
      next: () => this.router.navigate(['/produtos']),
      error: e => {
        this.erro.set(e.error?.message ?? 'Erro ao salvar');
        this.salvando.set(false);
      }
    });
  }
}
```

## Edição (preencher form com dados existentes)

```typescript
ngOnInit() {
  this.service.obterProduto(this.id()).subscribe(produto => {
    this.form.patchValue({
      Nome:      produto.Nome,
      Preco:     produto.Preco,
      Descricao: produto.Descricao
    });
  });
}
```

## Validações Comuns

```typescript
form = this.fb.group({
  Nome:  ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
  Email: ['', [Validators.required, Validators.email]],
  Cpf:   ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
  Valor: [null, [Validators.required, Validators.min(0.01)]],
});
```

## Exibir Erros no Template

```html
@if (form.get('Nome')?.hasError('required') && form.get('Nome')?.touched) {
  <span class="erro">Nome obrigatório</span>
}
@if (form.get('Email')?.hasError('email') && form.get('Email')?.touched) {
  <span class="erro">E-mail inválido</span>
}
```

## Sem Template-driven

```html
<!-- ❌ NUNCA -->
<input [(ngModel)]="nome" required />

<!-- ✅ SEMPRE -->
<input formControlName="Nome" />
```

## Request a partir do Form

```typescript
// Request tem constructor que recebe o shape do form
const request = new ProdutoCriarRequest(this.form.getRawValue());
// ou
const request = new ProdutoCriarRequest({
  Nome:  this.form.value.Nome!,
  Preco: this.form.value.Preco!
});
```

Ver `standards/angular/conventions.md` para naming de Request.
