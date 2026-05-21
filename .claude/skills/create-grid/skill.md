---
name: create-grid
description: Gera um componente de grid DS Grid completo (5 arquivos) para listagem paginada de entidades no padrão Albatroz.
---

> **⚠️ Requer Design System** — Esta skill depende de `@ds/grid` e `@ds/utils`. Não utilizar enquanto o pacote não estiver instalado no projeto.

# /create-grid — Componente Grid DS Completo

Use este comando para gerar toda a estrutura de um grid de listagem (data table).

**Sintaxe:**
```
/create-grid {modulo} {entidade}
```

**Exemplos:**
```
/create-grid usuarios Usuarios
/create-grid produtos Produtos
/create-grid fornecedores Fornecedores
/create-grid pedidos Pedidos
```

## O que Gera

Para cada requisição:

1. **Grid Config** (`app/{modulo}/grids/listagem-{entidade}.grids.ts`)
   - Função `{ENTIDADE}_LISTAGEM_GRID_CONFIG()`
   - Colunas padrão (Id, Nome, Status, CriadoEm)
   - Config global de paginação

2. **Request DTO** (`app/{modulo}/models/requests/{Entidade}ListarRequest.ts`)
   - Extends `PaginacaoRequest`
   - Campos padrão para filtro (Filtro?, Status?)
   - Construtor

3. **Response Interface** (`app/{modulo}/models/responses/{Entidade}Response.ts`)
   - Interface com campos padrão
   - PascalCase properties

4. **Componente de Listagem** (`app/{modulo}/components/listagem-{entidade}/listagem-{entidade}.component.ts`)
   - Extends `DsGridHelperComponent`
   - Signals: `input()`, `output()`
   - Gerencia paginação, ordem, quantidade

5. **Template HTML** (`app/{modulo}/components/listagem-{entidade}/listagem-{entidade}.component.html`)
   - `ds-grid-customizado` pronto
   - Listeners: `onTrocarPagina`, `onTrocarOrdem`, `onTrocarQuantidade`

6. **Serviço HTTP** (`app/{modulo}/servicos/{modulo}.service.ts`)
   - Método `listar{Entidade}(request)` — Observable
   - URL base via `environment.config.apis`

## Depois de Gerar

1. **Criar Response interface** — o gerado é template, você define os campos reais
2. **Implementar serviço HTTP** — a URL base e método já estão, apenas verifique endpoint correto
3. **Adicionar colunas ao grid** — o gerado tem padrão, customize conforme necessário
4. **Registrar no módulo** — import e declare o componente
5. **Criar página que usa o grid** — componente pai passa `request`, `dados`, `carregando` e escuta `onPaginarOrdenar`
6. **Testar** — verificar paginação, ordem, filtro

## Padrão Gerado — Exemplo

### Grid Config

`app/usuarios/grids/listagem-usuarios.grids.ts`:
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
      { name: 'Id', prop: 'Id', sortable: true, cellClass },
      { name: 'Nome', prop: 'Nome', sortable: true, cellClass },
      { name: 'Email', prop: 'Email', sortable: false, cellClass },
      { name: 'Status', prop: 'Status', sortable: true, cellClass },
      { name: 'Data Criação', prop: 'DataCriacao', sortable: true, cellClass }
    ]
  };
}
```

### Request DTO

`app/usuarios/models/requests/usuarios-listar.request.ts`:
```typescript
import { PaginacaoRequest } from '@ds/utils';

export class UsuariosListarRequest extends PaginacaoRequest {
  Filtro?: string;
  Status?: string;

  constructor(params: Partial<UsuariosListarRequest>) {
    super(params);
    this.Filtro = params.Filtro;
    this.Status = params.Status;
  }
}
```

### Response Interface

`app/usuarios/models/responses/usuario.response.ts`:
```typescript
export interface UsuarioResponse {
  Id: number;
  Nome: string;
  Email: string;
  Status: string;
  DataCriacao: string;
}
```

### Componente

`app/usuarios/components/listagem-usuarios/listagem-usuarios.component.ts`:
```typescript
import { Component, input, output } from '@angular/core';
import { DsGridHelperComponent, DsGridConfig } from '@ds/grid';
import { PaginacaoResponse } from '@ds/utils';
import { USUARIOS_LISTAGEM_GRID_CONFIG } from '../../grids/listagem-usuarios.grids';
import { UsuarioResponse } from '../../models/responses/usuario.response';
import { UsuariosListarRequest } from '../../models/requests/usuarios-listar.request';

@Component({
  selector: 'app-listagem-usuarios',
  template: require('./listagem-usuarios.component.html'),
  styleUrls: ['./listagem-usuarios.component.scss']
})
export class ListagemUsuariosComponent extends DsGridHelperComponent {
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

### Template

`app/usuarios/components/listagem-usuarios/listagem-usuarios.component.html`:
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

### Serviço

`app/usuarios/servicos/usuarios.service.ts`:
```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaginacaoResponse } from '@ds/utils';
import { UsuariosListarRequest } from '../models/requests/usuarios-listar.request';
import { UsuarioResponse } from '../models/responses/usuario.response';

export class UsuariosService {
  private readonly API_URL = environment.config.apis.usuarioApi;
  private readonly http = inject(HttpClient);

  listarUsuarios(request: UsuariosListarRequest): Observable<PaginacaoResponse<UsuarioResponse>> {
    return this.http.get<PaginacaoResponse<UsuarioResponse>>(
      `${this.API_URL}/usuarios`,
      { params: { ...request } }
    );
  }
}
```

## Uso em Página

Componente pai (página) que usa o grid:

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
    { initialValue: { Registros: [], Total: 0 } }
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

---

## Customizações Comuns

### Adicionar Coluna com Pipe

```typescript
export function USUARIOS_LISTAGEM_GRID_CONFIG() {
  return {
    // ...
    colunas: [
      // ...
      {
        name: 'Data Criação',
        prop: 'DataCriacao',
        sortable: true,
        cellClass: 'text-center',
        cellTemplate: (row: UsuarioResponse) =>
          new DateTimePtbrPipe().transform(row.DataCriacao) // pipe customizado
      }
    ]
  };
}
```

### Adicionar Ação (botão) ao Grid

```typescript
export function USUARIOS_LISTAGEM_GRID_CONFIG() {
  return {
    // ...
    possuiAcoes: true,
    // ações são mapeadas no componente pai via outputs
  };
}

// No componente:
@Output() onEditar = new EventEmitter<UsuarioResponse>();
@Output() onRemover = new EventEmitter<UsuarioResponse>();

handleAcao(acao: string, usuario: UsuarioResponse) {
  if (acao === 'editar') this.onEditar.emit(usuario);
  if (acao === 'remover') this.onRemover.emit(usuario);
}
```

### Filtro + Busca

Adicionar campo de busca na página acima do grid:

```typescript
export class UsuariosPageComponent {
  filtro = signal('');
  status = signal('');

  usuariosRequest = computed(() => {
    const baseRequest = new UsuariosListarRequest({ Pg: 1, Qt: 20 });
    baseRequest.Filtro = this.filtro();
    baseRequest.Status = this.status();
    return baseRequest;
  });

  usuariosData = toSignal(
    toObservable(this.usuariosRequest).pipe(
      debounceTime(300),
      switchMap(req => this.service.listarUsuarios(req))
    ),
    { initialValue: { Registros: [], Total: 0 } }
  );
}
```

Template:
```html
<div class="row mb-3">
  <div class="col-md-6">
    <input 
      type="text" 
      class="form-control" 
      placeholder="Filtrar..."
      [(ngModel)]="filtro"
      (change)="filtro.set($any($event.target).value)">
  </div>
  <div class="col-md-6">
    <select class="form-control" [(ngModel)]="status">
      <option value="">Todos os Status</option>
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

---

## Notas

- **Extends DsGridHelperComponent:** Fornece métodos `trocarPagina()`, `trocarOrdem()`, `trocarQuantidade()`
- **track by em @for:** Grid já faz isso internamente
- **Cache de resultados:** Use `shareReplay(1)` no observable se necessário
- **Paginação via PaginacaoRequest:** Pg (página, default 1), Qt (quantidade, max 100), Offset calculado no backend
