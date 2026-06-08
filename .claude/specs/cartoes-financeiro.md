# Cartões e Faturas — Spec UI

> Status: aprovado
> Domínio: Financeiro
> Última revisão: 2026-06-01

---

## Problema

Operadores do ERP precisam acompanhar o uso dos cartões de crédito da empresa, visualizar faturas por período e controlar limites. Sem essa tela, o controle financeiro de cartões é feito manualmente em planilhas, sem visibilidade de limite global nem histórico de faturas.

---

## Objetivo

Permitir que o operador visualize todos os cartões (principais e adicionais), acompanhe limites globais e por cartão, e acesse o histórico de faturas com status e valores totais.

---

## Tela e componentes

- **Arquétipo:** dashboard
- **Rota:** `/financeiro/cartoes`
- **Componente:** `CartoesDashboardComponent`
- **Componentes DS:** hero header, cards KPI (total gasto, limite global, percentual uso), tabela de faturas com status pill, modal de criação/edição de cartão, modal de gerenciamento de categorias

**Ações disponíveis:**
- Criar cartão principal
- Criar cartão adicional (vinculado a principal)
- Editar cartão
- Gerenciar categorias de despesa
- Navegar para upload de extração de fatura

---

## Fluxo do usuário

**Fluxo principal — visualizar dashboard:**
1. Usuário acessa `/financeiro/cartoes`
2. Sistema carrega lista de cartões (principais com adicionais aninhados)
3. Sistema carrega faturas de todos os cartões em paralelo
4. Dashboard exibe: cards KPI globais + grid de cartões + lista de faturas recentes

**Fluxo — criar/editar cartão:**
1. Usuário clica em "Novo cartão" ou ícone de edição
2. Modal `CartaoModalComponent` abre com form
3. Usuário preenche: apelido, últimos 4 dígitos, bandeira, dia vencimento/fechamento, limite
4. Para adicional: seleciona cartão principal no form
5. Submit → API → modal fecha → dashboard recarrega

**Fluxo — gerenciar categorias:**
1. Usuário clica em "Categorias"
2. Modal `CategoriaModalComponent` abre com lista de categorias
3. Usuário pode criar, editar ou excluir categorias
4. Exclusão exibe confirmação antes de chamar API

---

## Critérios de aceite

- [ ] Dashboard carrega e exibe KPIs globais (total gasto, limite total, limite usado, percentual)
- [ ] Cartões adicionais aparecem aninhados sob o principal
- [ ] Barra de uso do limite muda de cor: verde < 70%, âmbar 70-90%, vermelho ≥ 90%
- [ ] Faturas exibem status pill colorido: aberta (âmbar), processada (azul), paga (verde)
- [ ] Modal de cartão valida campos obrigatórios antes de submeter
- [ ] Exclusão de categoria exige confirmação
- [ ] Recarrega automaticamente após criar/editar cartão ou categoria

---

## Casos de erro / edge cases

| Cenário | Trigger | Comportamento esperado |
|---------|---------|------------------------|
| Sem cartões cadastrados | API retorna `[]` | Dashboard exibe estado vazio com CTA "Criar cartão" |
| Falha ao carregar faturas | Erro de rede | `carregando` volta para false, estado de erro exibe mensagem |
| Cartão sem fatura | Nenhuma fatura no período | Linha de faturas vazia, KPIs zerados para aquele cartão |
| Limite total zero | `limiteTotal = 0` | `percentualUso` = 0%, sem divisão por zero |

---

## Integrações de API

| Endpoint | Método | Quando chamado |
|----------|--------|----------------|
| `/v1/financeiro/cartoes` | GET | ngOnInit, após criar/editar cartão |
| `/v1/financeiro/cartoes` | POST | Submit do modal de criação |
| `/v1/financeiro/cartoes/{id}` | PUT | Submit do modal de edição |
| `/v1/financeiro/faturas?cartaoId={id}` | GET | Após carregar cartões (por cartão) |
| `/v1/financeiro/categorias-despesa` | GET | ngOnInit do modal de categorias |
| `/v1/financeiro/categorias-despesa` | POST | Criar categoria |
| `/v1/financeiro/categorias-despesa/{id}` | PUT | Editar categoria |
| `/v1/financeiro/categorias-despesa/{id}` | DELETE | Excluir categoria |

---

## Regras de negócio

- API retorna cartões principais com adicionais aninhados em `adicionais[]`; dashboard achata para contagens e cruzamento de faturas
- KPIs globais excluem faturas com `status === 3` (pagas) dos totais de gasto
- Percentual de uso é calculado no frontend: `limiteUsado / limiteTotal * 100`
- Cartão adicional sempre tem `idCartaoPrincipal` preenchido
- Multi-tenant: `empresaId` presente em todos os registros retornados
