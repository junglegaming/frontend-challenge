# 12 — Responsividade: auditoria e implementação

> Registro técnico da rodada de responsividade (2026-10-31). A validação visual
> **final** é independente (Google Antigravity); este documento descreve o que
> foi alterado, o que foi medido e o que ainda precisa de olhar humano.

## 1. Referências e estratégia

- O Figma só tem dois frames: **414** (mobile) e **1440** (desktop, conteúdo de
  1200px com padding de 120px). Perfil, Carteiras e Confirmação não têm frame
  mobile.
- Os componentes usavam `lg:` (1024px) para aplicar medidas exatas do frame
  1440. Como 1024 < 1200, várias telas estouravam ou ficavam espremidas entre
  1024 e 1279px.
- **Regra adotada:**
  - **≥ `xl` (1280px):** medidas exatas do Figma (cabem os 1200px).
  - **`lg` (1024–1279px):** mesmo arranjo do desktop, com larguras fluidas
    (`flex-1`, `min-w-0`, `max-w-*`) no lugar das fixas.
  - **`md` (768–1023px):** layout desktop compacto; o que não cabe vai para o
    padrão mobile (ex.: filtros em modal).
  - **< `md`:** layouts mobile do Figma, sem alteração.
- **Container de página:** `max-w-[1248px] px-4 sm:px-6` (1200 + 2×24). Em 1440
  o conteúdo continua em x=120 com 1200px, idêntico ao Figma. Abaixo disso ele
  alinha com o Header (`px-6`) em vez de manter 120px fixos.

## 2. Alterações por componente

### Compartilhados (prioridade)

| Componente | Problema observado | Correção |
| --- | --- | --- |
| `Header` | Em 768–1023 com sessão, "Aprenda" colidia com a busca/carrinho: o bloco de ações tinha `md:w-[207px]`, mas Carteiras/Perfil/Sair passam disso. | Logo `lg:w-[160px]`, nav `gap-6 lg:gap-10`, ações `md:gap-4 xl:w-[207px] xl:gap-7`. |
| `Footer` | Overflow horizontal em **todas** as páginas em 1024 (frame fixo de 1200px aplicado em `lg`). Texto com `w-[325px]` estourava em 320. Em `lg` fluido, os títulos quebravam em 2 linhas sobre `h-[16px]` e invadiam o parágrafo. | Medidas fixas passam a `xl:`; em `lg` as colunas usam `flex-1`/`min-w-0`, divisórias `self-stretch`; `w-[204px]`/`w-[325px]` → `w-full max-w-*`; títulos `min-h-[16px]`. |
| `CatalogSkeleton`, `NftCardSkeleton` | Espelham a grade e o card. | Mesmas regras da grade (abaixo). |

### Páginas

| Arquivo | Problema observado | Correção |
| --- | --- | --- |
| `routes/index.tsx` | Entre 768 e 1023 os **filtros ficavam inacessíveis** (a sidebar era `lg:block`; o botão e o modal mobile eram `md:hidden`). Em 768–1199 o conteúdo encostava nas bordas (`md:px-0`). Em 1024 a grade (`lg:w-[842px]`) + sidebar estouravam. As abas quebravam linha. | Botão "Filtros" na toolbar (`lg:hidden`) que abre o mesmo modal (agora `lg:hidden`). Container `md:px-6 xl:px-0`. Grade com largura fixa só em `xl`. Toolbar com `flex-wrap`, abas `whitespace-nowrap`, grupo de ordenação com `ml-auto`. |
| `NftGrid`, `NftCard` | 3 colunas de 258px não cabem em 1024 com a sidebar. A `ul` encolhia ao conteúdo (o pai usa `items-end`). | `lg`: 2 colunas; `xl`: 3 colunas, 842px. `w-full` na `ul`. Card `xl:w-[258px]`. |
| `SortSelect` | O rótulo "Listados recentemente" quebrava linha. | `whitespace-nowrap` no rótulo. |
| `Hero` (desktop) | Em 768–1023 a imagem ficava oculta (metade do banner vazia); em 1024 o `gap-[110px]` espremia o título. | Imagem visível a partir de `md` (280 → `lg` 400 → `xl` 450px); `gap-10 xl:gap-[110px]`; texto `xl:w-[600px]`. |
| `Promos` | Dois cards de 586px fixos em `lg`. | `lg:flex-1 lg:min-w-0`, `xl:w-[586px]`. |
| `nft.$nftId`, `carrinho`, `pagamento`, `pedido.$orderId`, `carteiras` | `lg:px-[120px]` deixava ~784px de conteúdo em 1024 (título do NFT quebrando, tabela do carrinho com preços quebrados e resumo cortado fora da tela, formulário do pagamento espremido). | Container `max-w-[1248px]` sem o padding fixo de 120px. |
| `carteiras` | `lg:w-[862px]` + sidebar 310 → overflow em 1024 **e em 1280**. | `lg:flex-1 lg:min-w-0` (resulta em 862px em ≥1280). |
| `carrinho` | O preço "1.19 ETH" quebrava em 2 linhas na coluna de 77px (inclusive em 1440). | `whitespace-nowrap` nas células de preço e total. |
| `login`, `cadastro` | Logo e título com `w-[358px] shrink-0` → overflow em 320px. | `w-full` (o pai já limita a `max-w-[358px]`). |

Nenhuma cor, fonte, espaçamento de componente ou token do design system foi
alterado. Não houve mudança de lógica, contratos ou mocks.

## 3. Resoluções testadas

Ferramenta: `scripts/audit-responsivo.mjs` (Playwright/Chromium, DPR 1,
`reducedMotion`), logado com `nova@kurio.test`, carrinho com 2–3 itens e um
pedido confirmado.

- **Larguras:** 320, 360, 375, 414, 600, 768, 900, 1024, 1280, 1440, 1920.
- **Rotas:** `/`, `/nft/nft-1`, `/carrinho`, `/pagamento`, `/pedido/:id`,
  `/perfil`, `/carteiras`, `/login`, `/cadastro` (99 combinações).
- **Métricas:** `scrollWidth` do documento vs. viewport, elementos visíveis fora
  da viewport (ignorando ancestrais com overflow que recortam) e texto que
  estoura a própria caixa.

## 4. Resultados

| Métrica | Antes | Depois |
| --- | --- | --- |
| Combinações com overflow horizontal | 14 (todas as rotas em 1024; carteiras em 1280; login/cadastro/pedido/perfil/carteiras em 320) | **0** |
| Diferença de pixels em 414 / 1440 / 1920 (antes × depois) | — | 0 px em 7 de 9 rotas. Carrinho: correção intencional do preço quebrado. Pedido: hash de transação dinâmico. |

- `typecheck`, `lint`, `prettier`: ok.
- `test:unit`: 49/49.
- `test:e2e`: 85/87 (2 skips intencionais de layout mobile); os baselines
  visuais foram atualizados e estão verdes.
- Fluxo de filtros verificado em 768, 900 e 1023 (abre o modal, aplica e fecha)
  e em 1024 (sidebar visível, botão oculto).

## 5. Problemas conhecidos (não alterados)

- **600px (celular grande / tablet pequeno):** as telas mobile ficam numa coluna
  central de 366–414px (busca, abas, grade e tab bar) com faixas vazias nas
  laterais. Comportamento herdado do frame mobile; não alterei por não haver
  referência de design.
- **Header em `/carteiras` e `/perfil`:** a aba ativa é "Início" (regra
  `isHome` do Header). Não é questão de responsividade; fica só registrado.
- **Modal de filtros aberto durante o redimensionamento para ≥1024:** o modal
  some (`lg:hidden`), mas o estado e a trava de scroll continuam até recarregar.
  Já acontecia antes em 768 (`md:hidden`); só ocorre ao redimensionar a janela.
- **`features/catalog/components/Newsletter.tsx`** parece não ser usado (o
  Footer tem a própria newsletter). Não alterei.
- **Falso positivo da auditoria:** o badge absoluto do carrinho no Header soma
  ao `scrollWidth` do link e aparece como "texto estourado" em todas as larguras
  ≥ md.

## 6. Pontos para inspeção visual independente

1. **Header em 768–1023 com sessão:** espaçamento entre nav e ações (ficou
   justo, ~30px em 768).
2. **Footer em 1024–1279:** colunas fluidas, títulos dos medalhões em 2 linhas,
   divisórias acompanhando a altura.
3. **Catálogo em 768–1279:** botão "Filtros" (estilo novo, sem frame no Figma),
   toolbar quebrando em 2 linhas, grade de 2 colunas ao lado da sidebar em 1024.
4. **Hero em 768–1023:** imagem de 280px ao lado do título (antes oculta).
5. **Telas com container novo em 1024 e 1280** (Detalhe, Carrinho, Pagamento,
   Pedido, Carteiras): alinhamento com o logo do Header e proporção das colunas.
6. **Cadastro em 320:** o título "Criar perfil de colecionador" quebra em 2
   linhas dentro de um container `h-4`; ocupa o gap de 40px abaixo, sem
   sobrepor os campos.
7. **Promos em 1024:** cards fluidos com a imagem de largura fixa.
8. **Baselines de `visual.spec.ts`:** aprovadas e verdes em 1280; atualizar
   apenas quando houver mudança visual intencional.

## 7. Como reproduzir

```bash
npm run dev
node scripts/audit-responsivo.mjs reports/responsivo            # todas as rotas
node scripts/audit-responsivo.mjs reports/responsivo inicio,carrinho
```

Saída: um PNG de página inteira por rota × largura e `report.json` com as
métricas (`reports/` está no `.gitignore`).
