# Extração de Fatura — Spec UI

> Status: aprovado
> Domínio: Financeiro
> Última revisão: 2026-06-01

---

## Problema

Operadores precisam importar despesas de faturas de cartão (PDF) para o ERP sem digitar linha a linha. A extração via IA (Albia/Gemini) é pesada demais para resposta síncrona — o PDF precisa ser processado de forma assíncrona via job Hangfire no backend.

---

## Objetivo

Permitir que o operador faça upload de um PDF de fatura, acompanhe o processamento assíncrono e revise/edite as despesas extraídas antes de salvar no ERP.

---

## Tela e componentes

- **Arquétipo:** form multistep (upload → processando → revisão → salvo)
- **Rota:** `/financeiro/cartoes/upload`
- **Componente:** `FaturaUploadComponent`
- **Componentes:** zona de drag-and-drop, select de cartão, spinner de processamento, grid de despesas editável, `CategoriaSelectComponent` por linha, modal de projeção de parcelas (`ProjecaoModalComponent`)

**Estados da tela:**
- `idle` — aguardando arquivo e cartão
- `enviando` — fazendo POST do PDF
- `processando` — polling a cada 3s aguardando job Hangfire
- `concluido` — grid de despesas populado, pronto para revisão
- `erro` — exibe mensagem de erro, permite tentar novamente

---

## Fluxo do usuário

**Fluxo principal — extração e salvamento:**
1. Usuário seleciona cartão no dropdown
2. Usuário faz drag-and-drop ou seleciona PDF via file input
3. Clica em "Extrair" — sistema envia PDF via `POST /v1/financeiro/faturas/extrair`
4. Backend enfileira job Hangfire e retorna `202 Accepted` com `{ jobId }`
5. Frontend inicia polling a cada 3s: `GET /v1/financeiro/faturas/extrair/{jobId}`
6. Quando `status === 'concluido'`: popula grid de despesas + cabeçalho da fatura
7. Usuário revisa despesas, ajusta valores, atribui categorias por linha
8. Se houver despesas parceladas com `parcelaAtual === 1`: modal de projeção abre
9. Usuário confirma projeção de parcelas futuras (ou ignora)
10. Clica em "Salvar" → `POST /v1/financeiro/faturas/{id}/despesas` → redireciona para `/financeiro/cartoes`

**Fluxo alternativo — adicionar linha manual:**
- Usuário clica em "Adicionar linha" → nova linha vazia no grid → preenche manualmente

**Fluxo alternativo — criar categoria inline:**
- No `CategoriaSelectComponent`, usuário digita nome que não existe e clica em "Criar"
- Sistema cria categoria via API e atualiza a linha automaticamente

---

## Critérios de aceite

- [ ] Tela aceita apenas PDF (valida tipo no drag-drop e file input)
- [ ] Botão "Extrair" bloqueado se cartão ou arquivo não selecionado
- [ ] Spinner com mensagem "Processando com Albia..." exibido durante polling
- [ ] Grid mostrа divergência (em vermelho) se `totalGrid ≠ cabecalho.valorTotal` (tolerância 0,01)
- [ ] Modal de projeção abre apenas para despesas parceladas com `parcelaAtual === 1`
- [ ] Polling para automaticamente quando job conclui ou retorna erro
- [ ] Polling limpo no `ngOnDestroy` (sem memory leak)
- [ ] Erro de API exibe mensagem do campo `mensagem` do `Resultado<T>`

---

## Casos de erro / edge cases

| Cenário | Trigger | Comportamento esperado |
|---------|---------|------------------------|
| Arquivo não-PDF | Drag-drop de imagem ou doc | Erro: "Apenas arquivos PDF são aceitos" |
| Job falha no backend | `status === 'erro'` no polling | Exibe `status.erro`, para polling, permite tentar novamente |
| Erro de rede no polling | HTTP error | Para polling, exibe "Erro ao consultar status da extração" |
| PDF sem despesas | Backend retorna `despesas: []` | Grid vazio, divergência mostra valor total como pendente |
| Usuário navega antes de salvar | `ngOnDestroy` | Polling limpo via `clearInterval`, dados descartados |

---

## Integrações de API

| Endpoint | Método | Quando chamado |
|----------|--------|----------------|
| `/v1/financeiro/cartoes` | GET | ngOnInit (popular dropdown) |
| `/v1/financeiro/categorias-despesa` | GET | ngOnInit (popular selects de categoria) |
| `/v1/financeiro/faturas/extrair` | POST (multipart) | Clique em "Extrair" |
| `/v1/financeiro/faturas/extrair/{jobId}` | GET | Polling a cada 3s |
| `/v1/financeiro/faturas/{id}/despesas` | POST | Clique em "Salvar" |
| `/v1/financeiro/categorias-despesa` | POST | Criar categoria inline no grid |

---

## Regras de negócio

- Upload usa `multipart/form-data` com campos `arquivo` (File) e `cartaoId` (string) — não usa `ApiService`, usa `HttpClient` diretamente para suporte a multipart
- Job Hangfire: backend retorna `202 Accepted` com `jobId`; frontend faz polling até `status === 'concluido'` ou `status === 'erro'`
- Intervalo de polling: 3000ms (3s)
- Divergência calculada: `cabecalho.valorTotal - totalGrid`; exibida apenas se `Math.abs(diff) > 0.01`
- Projeção de parcelas: apenas despesas com `totalParcelas > 1 && parcelaAtual === 1` entram no modal
- Ao salvar, `faturaId = 0` — backend cria/associa a fatura ao processar as despesas
