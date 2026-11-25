---
name: angular-grids
description: Padrão de DS Grid customizado em Angular. Grid Config, componentes, paginação, filtros.
---

> **⚠️ Requer Design System** — Esta skill depende de `@ds/grid` e `@ds/utils`. Não utilizar enquanto o pacote não estiver instalado no projeto.

# Angular Grids — DS Grid Pattern

## Componentes

**Três camadas:**

1. **Grid Config** — configuração de colunas
2. **Componente** — estende `DsGridHelperComponent`
3. **Página** — gerencia dados, paginação, filtros

## Grid Config — Arquivo Separado

`app/modulo/grids/listagem-{entidade}.grids.ts`:

```typescript
import { DS_GRID_GLOBAL_CONFIG } from '@ds/grid';

export function USUARIOS_LISTAGEM_GRID_CONFIG() {
  const cellClass = 'text-center';
  return {
    global: DS_GRID_GLOBAL_CONFIG().global,
    possuiAcoes: true,
    radio: false,
    isAcoesEsquerda: false,
    colunas: [
      {
        name: 'Id',
        prop: 'Id',
        sortable: true,
        cellClass
      },
      {
        name: 'Nome',
        prop: 'Nome',
        sortable: true,
        cellClass
      },
      {
        name: 'Email',
        prop: 'Email',
        sortable: false,
        cellClass
      },
      {
        name: 'Status',
        prop: 'Status',
        sortable: true,
        cellClass
      },
      {
        name: 'Data Criação',
        prop: 'DataCriacao',
        sortable: true,
        cellClass
      }
    ]
  };
}
```

## Componente de Listagem

`app/modulo/components/listagem-{entidade}/`:

```typescript
import { Component, input, output, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DsGridHelperComponent, DsGridConfig } from '@ds/grid';
import { PaginacaoResponse } from '@ds/utils';
import { USUARIOS_LISTAGEM_GRID_CONFIG } from '../../grids/listagem-usuarios.grids';
import { UsuarioResponse } from '../../models/responses/usuario.response';
import { UsuariosListarRequest } from '../../models/requests/usuarios-listar.request';

@Component({
  selector: 'app-listagem-usuarios',
  templateUrl: './listagem-usuarios.component.html',
  styleUrls: ['./listagem-usuarios.component.scss']
})
export class ListagemUsuariosComponent extends DsGridHelperComponent implements OnInit {
  gridConfig = input.required<DsGridConfig>();
  carregando = input(false);
  dados = input<PaginacaoResponse<UsuarioResponse>>();
  
  @Input({ required: true }) override request!: UsuariosListarRequest;
  @Output() onPaginarOrdenar = new EventEmitter<UsuariosListarRequest>();

  ngOnInit() {
    this.gridConfig = USUARIOS_LISTAGEM_GRID_CONFIG();
  }
}
```

Template:
```html
<ds-grid-customizado
  id="grid-usuarios"
  [request]="request"
  [dados]="dados()"
  [config]="gridConfig()"
  [carregando]="carregando()"
  (onTrocarPagina)="trocarPagina($event)"
  (onTrocarOrdem)="trocarOrdem($event)"
  (onTrocarQuantidade)="trocarQuantidade($event)"
  class="atg-grid row-hover row-striped col-border">
</ds-grid-customizado>
```

## Página com Grid

```typescript
export class UsuariosPageComponent {
  private readonly service = inject(UsuariosService);

  usuariosRequest = signal<UsuariosListarRequest>(
    new UsuariosListarRequest({ Pg: 1, Qt: 20 })
  );

  usuariosData = toSignal(
    toObservable(this.usuariosRequest).pipe(
      switchMap(req => this.service.listarUsuarios(req))
    ),
    { initialValue: { Registros: [], Total: 0 } as PaginacaoResponse<UsuarioResponse> }
  );

  carregando = signal(false);

  buscarUsuarios(novoRequest: UsuariosListarRequest) {
    this.usuariosRequest.set(novoRequest);
  }
}
```

Template da página:
```html
<app-listagem-usuarios
  [request]="usuariosRequest()"
  [dados]="usuariosData()"
  [carregando]="carregando()"
  (onPaginarOrdenar)="buscarUsuarios($event)">
</app-listagem-usuarios>
```

## Grid com Filtros

Adicionar campos de filtro na página:

```typescript
export class UsuariosPageComponent {
  private readonly service = inject(UsuariosService);

  filtro = signal('');
  status = signal('');

  usuariosRequest = computed(() => {
    const req = new UsuariosListarRequest({ Pg: 1, Qt: 20 });
    req.Filtro = this.filtro();
    req.Status = this.status();
    return req;
  });

  usuariosData = toSignal(
    toObservable(this.usuariosRequest).pipe(
      debounceTime(300),
      switchMap(req => this.service.listarUsuarios(req))
    ),
    { initialValue: { Registros: [], Total: 0 } }
  );

  buscarUsuarios(novoRequest: UsuariosListarRequest) {
    // request é atualizado via computed
  }
}
```

Template com filtros:
```html
<div class="row mb-3">
  <div class="col-md-6">
    <input 
      type="text" 
      class="form-control" 
      placeholder="Filtrar por nome..."
      [value]="filtro()"
      (input)="filtro.set($any($event.target).value)">
  </div>
  <div class="col-md-6">
    <select 
      class="form-control"
      [value]="status()"
      (change)="status.set($any($event.target).value)">
      <option value="">Todos</option>
      <option value="ativo">Ativo</option>
      <option value="inativo">Inativo</option>
    </select>
  </div>
</div>

<app-listagem-usuarios
  [request]="usuariosRequest()"
  [dados]="usuariosData()"
  (onPaginarOrdenar)="buscarUsuarios($event)">
</app-listagem-usuarios>
```

## Customizar Colunas

### Com Pipe

```typescript
export function USUARIOS_LISTAGEM_GRID_CONFIG() {
  return {
    // ...
    colunas: [
      // ...
      {
        name: 'Data',
        prop: 'DataCriacao',
        sortable: true,
        cellTemplate: (row: UsuarioResponse) => {
          const pipe = new DateTimePtbrPipe();
          return pipe.transform(row.DataCriacao);
        }
      }
    ]
  };
}
```

### Com Classe CSS Dinâmica

```typescript
{
  name: 'Status',
  prop: 'Status',
  cellClass: (row: UsuarioResponse) => 
    row.Status === 'ativo' ? 'text-success' : 'text-danger'
}
```

## DsGridHelperComponent — Métodos Padrão

Estender `DsGridHelperComponent` fornece:

- `trocarPagina(novoRequest)` — emit quando muda página
- `trocarOrdem(novoRequest)` — emit quando muda ordenação
- `trocarQuantidade(novoRequest)` — emit quando muda tamanho

Não precisa implementar — só estender.

## Ações (Botões) no Grid

Grid com `possuiAcoes: true` renderiza coluna de ações. Mapear ações no componente:

```typescript
export class ListagemUsuariosComponent extends DsGridHelperComponent {
  @Output() onEditar = new EventEmitter<UsuarioResponse>();
  @Output() onRemover = new EventEmitter<UsuarioResponse>();

  editar(usuario: UsuarioResponse) {
    this.onEditar.emit(usuario);
  }

  remover(usuario: UsuarioResponse) {
    if (confirm('Confirmar remoção?')) {
      this.onRemover.emit(usuario);
    }
  }
}
```

Na página:
```html
<app-listagem-usuarios
  [request]="usuariosRequest()"
  [dados]="usuariosData()"
  (onEditar)="abrirEdicao($event)"
  (onRemover)="confirmarRemocao($event)"
  (onPaginarOrdenar)="buscarUsuarios($event)">
</app-listagem-usuarios>
```

## Classe de Estrutura

```
app/modulo/
├── grids/
│   └── listagem-{entidade}.grids.ts
├── components/
│   └── listagem-{entidade}/
│       ├── listagem-{entidade}.component.ts
│       ├── listagem-{entidade}.component.html
│       └── listagem-{entidade}.component.scss
├── paginas/
│   └── {entidade}/
│       ├── {entidade}.component.ts
│       ├── {entidade}.component.html
│       └── {entidade}.component.scss
├── models/
│   ├── requests/
│   └── responses/
├── servicos/
│   └── {modulo}.service.ts
└── {modulo}.module.ts
```

---

**Comando gerador:** `/create-grid {modulo} {entidade}` — gera todos os 5 arquivos automaticamente.
