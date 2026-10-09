# 08 — Tela Início: catálogo (busca/filtros/paginação)

**Onda:** 4 · **Paralela com:** `09-conta-auth` · **Depende de:** 03, 06, 07 · **Bloqueia:** 10
**Label sugerido:** `ui` · **Esforço:** G

## Objetivo

Tela de Início completa e fiel ao Figma: destaques, grid de NFTs, busca, filtros
combináveis, ordenação e paginação — tudo persistido na URL.

## Subtasks

### 08.1 — Composição da tela

- Layout do frame `2:2` (desktop) / `14:5226` (mobile) com componentes do tema
  (destaques, novidades, seções conforme o Figma)

### 08.2 — `NFTCard` + `NFTGrid`

- Card com imagem aspect-square, nome, coleção, edição, preço (`Price`), favorito
- Grid responsivo 3/2/1–2 colunas com skeleton por item

### 08.3 — Controles ligados à URL

- Busca, filtros (categorias/preço), `SortSelect`, `Pagination` sobre o `validateSearch`
  — mudança de filtro reseta `page=1`; sem parâmetros defaults = URL limpa

### 08.4 — Dados e estados

- TanStack Query (`keyFactory.nfts.list`) + Axios (`docs/api/nfts.md`)
- Estados: skeleton shimmer (dimensões preservadas) · vazio ("limpar filtros") ·
  erro (retry) · sucesso · refetch em segundo plano

### 08.5 — Robustez e acessibilidade

- Resposta fora de ordem descartada (cancelamento por query key/`signal`)
- Navegação por teclado no grid + foco visível · `alt` nas imagens

## Critérios de aceite (gate)

- [x] Refresh/histórico restauram exatamente busca+filtros+ordem+página
- [x] `pnpm typecheck && pnpm lint` verdes · conferência visual com o frame Figma

## Referências

- `docs/api/nfts.md` · `docs/ESTRUTURA.md` §3–4, §6.2 · `docs/ESTILOS.md` · frames `2:2`/`14:5226`
