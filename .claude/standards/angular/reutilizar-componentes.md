# Reutilizar componentes conhecidos (REGRA DURA)

Decidida pelo usuário em 2026-11-18, depois de dois erros seguidos na tela Estratégia editorial: um seletor múltiplo do PrimeNG usado sem o estilo do sistema (campo truncado e escrito "empty") e, na correção, botões novos inventados quando o sistema já tinha o seletor múltiplo padrão.

**Antes de criar ou estilizar qualquer elemento de UI, procurar o que o sistema já tem e usar igual.** Só criar algo novo quando nada serve, e dizer em uma linha, antes de escrever, o que foi procurado e por que não serviu.

## Procedimento

1. Procurar em `src/app/shared/components/`, `src/app/shared/utils/` e, com `grep`, em `src/app/contextos/` por tela que já tenha o mesmo tipo de campo (`grep -rn "p-multiSelect\|p-select\|p-toggleSwitch\|app-modal" src/app`).
2. Se existir tela com o mesmo elemento, copiar o padrão dela (mesmo componente, mesmo `[pt]`, mesmas propriedades), não reescrever.
3. Se o padrão estiver preso a uma tela ou contexto específico (`contextos/.../utils`), mover para `shared/` e importar de lá, em vez de copiar uma terceira vez.
4. Componente PrimeNG com `[unstyled]="true"` **sempre** leva o `[pt]` do sistema. Sem `[pt]` o campo aparece sem estilo. Cada componente PrimeNG tem partes próprias (o `p-multiSelect` tem `label`, `header`, `pcFilter`, `option`, `pcOptionCheckbox`...); o `[pt]` do `p-select` não serve para ele.
5. Se for criar um padrão novo, registrá-lo na tabela abaixo no mesmo commit.

## Inventário (atualizar sempre que mudar)

### Componentes compartilhados (`src/app/shared/components/`)
| Preciso de | Usar |
|------------|------|
| Janela de diálogo | `app-modal` |
| Gaveta lateral | `app-drawer` |
| Listagem com paginação | `app-listagem-paginada` (mais `app-th-ordenavel`, `app-colunas-configuraveis`) |
| Cabeçalho de página e trilha | `app-page-header`, `app-breadcrumb` |
| Botão de ícone / ação de linha | `app-btn-icone` |
| Carregando | `app-spinner`, `app-overlay-progresso` |
| Ligar/desligar | `app-toggle` (ou `p-toggleSwitch` com `PERFIL_TOGGLE_PT`/`PT_TOGGLE_SELECIONAR`) |
| Escolha única com busca no servidor | `app-select-busca` |
| Escolha múltipla com busca no servidor | `app-select-busca-multi` |
| Escolha múltipla de categorias | `app-select-categoria-multi` |
| Texto de ajuda de campo | `app-ajuda-campo`, `app-campo-hint` |
| Menu suspenso | `app-menu-dropdown` |
| Gráfico de barras | `app-grafico-barras` |
| Leitura de código de barras / teclado numérico | `app-leitor-codigo-barras`, `app-teclado-numerico` |

### Estilos `[pt]` do PrimeNG (use com `[unstyled]="true"`)
| Componente PrimeNG | Constante | Onde está |
|--------------------|-----------|-----------|
| `p-multiSelect` (lista fixa) | `PT_MULTISELECT` | `shared/utils/pt-multiselect.ts`. Usar com `[showToggleAll]="false"`, `[maxSelectedLabels]`, `selectedItemsLabel`, `placeholder`, `appendTo="body"` |
| `p-select` (lista fixa) | `PERFIL_SELECT_PT` | `contextos/administracao/configuracoes/models/perfil-social.model.ts` |
| `p-toggleSwitch` | `PERFIL_TOGGLE_PT` e `PT_TOGGLE_SELECIONAR` | `perfil-social.model.ts` e `contextos/balanco/utils/pt-toggle-selecionar.util.ts` |
| `p-select` de categoria | `PT_SELECT_CATEGORIA` | `contextos/balanco/utils/categoria-select.util.ts` |

Pendência de organização: mover `PERFIL_SELECT_PT`, `PERFIL_TOGGLE_PT`, `PT_TOGGLE_SELECIONAR` e `PT_SELECT_CATEGORIA` para `shared/utils/` na próxima vez que alguém mexer neles.

## Anti-padrões que já aconteceram
- `p-multiSelect` com o `[pt]` do `p-select`: campo truncado e "empty" na tela.
- Botões em linha criados do zero no lugar do seletor múltiplo padrão.
- Seletor de toggle com variante CSS `has-[:checked]` que não pega no elemento do PrimeNG: o toggle não ficava azul.
- Modal escrito à mão em vez de `app-modal` (2026-08-21).
