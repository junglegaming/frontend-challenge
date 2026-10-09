# Índice das Tarefas — ondas e paralelismo

Um arquivo `.md` por tarefa do Linear (título = nome do arquivo). Cada arquivo tem
seção **Subtasks** com blocos `###` prontos para virar sub-issues. A numeração indica
ordem sugerida; a **Onda** indica quando a tarefa pode começar — tarefas da mesma onda
são **paralelizáveis** (pessoas/sessões diferentes).

## Ondas

| Onda | Tarefas (paralelas entre si) | Depende de |
| ---: | --- | --- |
| livre | `01-mcp-figma` (opcional) | — |
| 1 | `02-scaffolding-base` | — |
| 2 | `03-tema-shadcn` ∥ `04-libs-core` ∥ `05-msw-assets` | 02 |
| 3 | `06-rotas` ∥ `07-mocks-e-contrato` | 02, 04 (+05 p/ 07) |
| 4 | `08-catalogo` ∥ `09-conta-auth` | 03, 06, 07 |
| 5 | `10-detalhe-favoritos` | 08, 09 |
| 6 | `11-carrinho` | 10 |
| 7 | `12-pagamento` ∥ `13-perfil-carteiras` | 12←11+09 · 13←09 |
| 8 | `14-tempo-real` ∥ `15-a11y-responsivo` | 14←11+12 · 15←12+13 |
| 9 | `16-playwright` | 12, 13, 14 |
| 10 | `17-lighthouse` ∥ `18-docs-entrega` | 17←15 · 18←14 |
| 11 | `19-deploy` | 17, 18 |
| 12 | `20-revisao-final` | 16, 19 |

## Cadeia obrigatória (não reordenar)

```
02 → 04 → 06 ─┐
02 → 05 → 07 ─┴→ 08 ∥ 09 → 10 → 11 → 12 ∥ 13 → 14 ∥ 15 → 16 → 17/18 → 19 → 20
```

Pontos de maior ganho em paralelo: **ondas 2, 3, 4, 7, 8 e 10**.

## Dependências cruzadas importantes

- `06-rotas` e `07-mocks` não dependem um do outro — roteamento puro ∥ camada de dados.
- `08-catalogo` e `09-conta-auth` são públicas e independentes (favoritos entram no 10).
- `13-perfil-carteiras` pode correr junto do checkout — ambos só precisam do auth (09).
- `15-a11y-responsivo` só audita telas prontas (12+13), mas é independente do 14.
- `18-docs-entrega` escreve README/ARCHITECTURE enquanto o 17 roda Lighthouse.

## Como importar no Linear

1. Copie o título do arquivo (`# …`) como título da **issue pai**.
2. Cole **Objetivo** + **Critérios de aceite (gate)** como descrição da issue.
3. Cada bloco `### NN.SS — título` da seção **Subtasks** vira uma **sub-issue**:
   título = o texto do `###`, descrição = os bullets dele.
4. Aplique as dependências da tabela acima com a feature de *blocked by*.
5. Sugestão de labels: `fase-1-fundacao`, `ui`, `mocks`, `testes`, `docs`, `deploy`.
