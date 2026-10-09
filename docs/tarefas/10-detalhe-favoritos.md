# 10 — Tela Detalhes do NFT + favoritos

**Onda:** 5 · **Paralela com:** — · **Depende de:** 08, 09 · **Bloqueia:** 11
**Label sugerido:** `ui` · **Esforço:** M

## Objetivo

Tela de detalhe com galeria, informação, quantidade e compra; favoritos com
atualização otimista protegida por sessão.

(página de detalhes)[https://www.figma.com/design/SXihYJLrfKxbEdy60kqVVN/Frontend-Challenge?node-id=10-244&t=K6KVwVRR87trdsCP-11]
(componente complexo)[https://www.figma.com/design/SXihYJLrfKxbEdy60kqVVN/Frontend-Challenge?node-id=70342-2763&t=K6KVwVRR87trdsCP-11]

Preste muita atenção nesse `componente complexo` para definir com exatidão!

Crie componentes reutilizaveis, trabalhe com coding split.

## Subtasks

### 10.1 — Composição + galeria

- Frames `10:244` (desktop) / `15:5536` (mobile): galeria de imagens, descrição,
  coleção/criador, atributos, status `RARO`

### 10.2 — Casos especiais de acesso

- Acesso direto por URL + refresh · NFT inexistente → estado 404 amigável com link
  ao catálogo · bloco de **edição indisponível** quando `editable: false`

### 10.3 — Quantidade e compra

- `QuantityStepper` com limite de `available` · botão comprar → adiciona ao carrinho
  e navega

### 10.4 — Favorito otimista

- Molde cancel → snapshot → apply → rollback + toast de erro; `onSettled` invalida
  `favorites`; visitante → `/login?redirect=` e retorno ao fluxo

### 10.5 — Skeletons e feedback

- Skeleton shimmer na galeria/card de compra · feedback `aria-live` nas mutações

## Critérios de aceite (gate)

- [x] Cenário `erro-4xx` mostra 404 amigável; falha de favorito faz rollback correto
- [x] `pnpm typecheck && pnpm lint` verdes · conferência com o frame

### Evidências do aceite

Validação realizada em 08/10/2026 após os ajustes de layout e a extração do
carrossel reutilizável:

| Subtarefa | Evidência |
| --- | --- |
| 10.1 | Galeria, descrição, coleção/criador, atributos e `RARO`; capturas em 1440, 414 e 390px sem overflow |
| 10.2 | E2E de acesso direto/refresh, NFT inexistente, cenário `erro-4xx` e `editable: false` aprovados nos dois perfis |
| 10.3 | E2E de limite, histórico, compra anônima/autenticada e conflito de estoque aprovados; navegação ocorre após sucesso |
| 10.4 | E2E de otimismo, rollback/toast, reconciliação, retorno do login e troca de sessão aprovados |
| 10.5 | Skeleton shimmer com redução de movimento e anúncios `aria-live` conferidos |

Typecheck, lint, 47 testes de contrato e build passaram. A rodada de E2E de
detalhe, rotas, destaque e carrossel da coleção terminou com 71 aprovados e um
skip esperado: a coleção não é renderizada no mobile. Os chunks de detalhe,
ampliação e seções complementares continuam separados.

A conferência visual usou os frames já extraídos em `docs/figma/file.json` e as
referências consultadas anteriormente. A renovação do contexto pelo Figma MCP
ficou indisponível pelo limite do plano Starter; não foi realizada uma nova
validação completa pelo MCP. Os ajustes de layout solicitados pelo usuário
foram preservados. Medidas, diferenças e limitações estão no
[relatório visual](../figma/nft-detail-validation.md).

## Referências

- `docs/api/nfts.md`, `docs/api/favorites.md` · `ARCHITECTURE.md` §3.4 · frames `10:244`/`15:5536`
