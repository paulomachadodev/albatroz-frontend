---
name: albatroz-angular
description: Padrão Albatroz para arquitetura e estrutura de projetos Angular 19. Organização de módulos, imports absolutos, convenções de naming.
---

# Diretrizes de Desenvolvimento

Você é um Engenheiro de Software Sênior especialista na stack Angular da nossa empresa.
Sempre siga estas regras estritas ao gerar código:

# Padrão Albatroz — Angular 19 Arquitetura

Aplicação single-page com **Signals obrigatório** (Angular 19+). Organize por **contexto de negócio**, não por tipo de arquivo.

## Estrutura de Módulos

```
app/
├── {modulo}/
│   ├── components/
│   ├── grids/
│   ├── models/
│   │   ├── requests/
│   │   ├── responses/
│   │   └── enum/
│   ├── paginas/
│   ├── servicos/
│   └── {modulo}.module.ts
├── shared/
│   ├── components/
│   ├── pipes/
│   ├── directives/
│   └── shared.module.ts
└── app.component.ts
```

## Imports — Sempre Absolutos

Configure `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "app/*": ["src/app/*"] }
  }
}
```

> **Ao instalar Design System:** Adicionar `"@ds/*": ["node_modules/@ds/*"]` ao `paths` de `tsconfig.json`.

```typescript
// ✅ CORRETO
import { UsuariosService } from 'app/usuarios/servicos/usuarios.service';

// ❌ ERRADO
import { UsuariosService } from '../../servicos/usuarios.service';
```

## Convenções de Naming

| Artefato | Padrão | Exemplo |
|----------|--------|---------|
| Componente | `{Nome}Component` | `UsuariosComponent` |
| Serviço | `{Contexto}Service` | `UsuariosService` |
| Pipe | `{Nome}Pipe` | `DataFormatPipe` |
| Request | `{Entidade}{Acao}Request` | `UsuarioCriarRequest` |
| Response | `{Entidade}Response` | `UsuarioResponse` |
| Grid Config | `{ENTIDADE}_LISTAGEM_GRID_CONFIG()` | `USUARIOS_LISTAGEM_GRID_CONFIG()` |
| Módulo | `{Contexto}Module` | `UsuariosModule` |

## Princípios

- **Sem @Input/@Output antigos** — usar `input()` e `output()` (Signal inputs)
- **Sem JSDoc** — nomes auto-explicativos
- **Sem lógica no template** — tudo computado no `.ts`
- **Max 400 linhas** — componentes pequenos e focados
- **Injetar via `inject()`** — não constructor

---

## Quando Usar Cada Skill

- **@angular-components** — padrão de componentes dumb, Signals, lifecycle
- **@angular-pages** — Smart Components, layout base com subheader e breadcrumbs
- **@angular-services** — HTTP Services, injeção de dependências
- **@angular-requests** — Request classes (constructor obrigatório, PascalCase, objetos aninhados)
- **@angular-responses** — Response interfaces (nomenclatura, PascalCase, objetos aninhados)
- **@angular-grids** — padrão de grids DS
- **@angular-routes** — rotas, lazy loading, guards, params com Signals
- **/create-grid** — gera grid completo (5 arquivos)

---

## Templates — Control Flow Novo

```html
<!-- ✅ Angular 19 -->
@if (usuario) { <p>{{ usuario.nome }}</p> }
@for (item of itens(); track item.id) { <div>{{ item.nome }}</div> }

<!-- ❌ Antigo -->
<p *ngIf="usuario">{{ usuario.nome }}</p>
<p *ngFor="let item of itens">{{ item.nome }}</p>
```

## RxJS Essencial

```typescript
// ✅ Pipe obrigatório
this.dados$ = this.filtro$.pipe(
  debounceTime(300),
  switchMap(f => this.service.buscar(f))
);

// ❌ Nunca subscribe aninhado
this.service.buscar().subscribe(dados => {
  this.service.processar(dados).subscribe(...) // NUNCA
});
```

---

## Checklist — Novo Módulo

- [ ] Pasta `app/{modulo}/`
- [ ] `{modulo}.module.ts`
- [ ] Primeiro componente ou página
- [ ] Serviço HTTP (veja @angular-services)
- [ ] Models: Request/Response (veja @angular-models)
- [ ] Grid config se listagem (veja @angular-grids)
