# 11 — Tela Carrinho (itens, cupom, cotação, tempo real)

**Onda:** 6 · **Paralela com:** — · **Depende de:** 10 · **Bloqueia:** 12, 14
**Label sugerido:** `ui` · **Esforço:** G

## Objetivo

Carrinho completo com persistência, disponibilidade, cupom e resumo vindo da API,
reativo a `nft.updated`.

## Subtasks

### 11.1 — Composição + CRUD de itens

- Frames `11:1278` (desktop) / `16:360` (mobile): adicionar/alterar quantidade/remover
  respeitando `available` (`409 INSUFFICIENT_STOCK` → manter valor válido + limite)

### 11.2 — Persistência e sessão

- Itens sobrevivem a refresh · carrinho do visitante preservado ao autenticar

### 11.3 — Cupom

- `CouponInput` aplicar/remover; `COUPON_INVALID` (erro no input) e `COUPON_EXPIRED`
  (mensagem + remoção automática) conforme `docs/api/quote.md`

### 11.4 — Resumo do `Quote`

- Subtotal, desconto, taxa de rede, total vindos da API — cálculo local só como
  feedback entre refetchs (`lib/money.ts`); skeleton do resumo

### 11.5 — Reatividade (`nft.updated`)

- Aviso "preço alterado de X para Y" + novo subtotal (`aria-live`) reagindo ao evento
  do socket pelas regras de versão (`ARCHITECTURE.md` §5)

### 11.6 — Estados

- Skeleton shimmer · carrinho vazio (CTA ao catálogo) · erro com retry

## Critérios de aceite (gate)

- [x] Cenários `cupom-ruim` e `preco-muda` comportam-se na UI
- [x] `pnpm typecheck && pnpm lint` verdes

## Verificação em 09/10/2026

Os dois critérios do gate foram atendidos. Isso ainda não representa a
conclusão integral das subtasks.

- `pnpm typecheck` e `pnpm lint`: aprovados.
- `pnpm test:contract`: 48 testes aprovados.
- Playwright: 14 testes aprovados em desktop e mobile para cupom inválido/
  expirado, `preco-muda`, merge no login, retry, expiração automática de
  cupom, versões de estoque e recomendações.

Pendências para concluir a tarefa:

- 11.4/11.6: `CartSkeleton` mostra apenas texto; falta skeleton shimmer para
  itens e resumo, respeitando `prefers-reduced-motion`.
- 11.4: `QuoteSummary` mostra o rótulo da taxa estimada, mas não exibe o
  valor de `quote.networkFee`.
- 11.1: a tabela usa rolagem horizontal no mobile; falta validar/adaptar a
  composição dos itens e controles para o frame mobile e zoom de 200%.
- Testes completos do carrinho: revisar expectativas antigas de cabeçalhos
  (`Quantidade`, `Total do item`, `Ações`) e de `Disponíveis: 8`, que não
  correspondem à UI atual. A preservação de quantidade deve continuar coberta.
- Verificação adicional: 2 testes de contador aprovados; 6 falhas
  em desktop/mobile nas expectativas de CRUD, estoque e tamanho do ícone
  do `QuantityStepper` na demonstração de tokens. A suíte completa ainda
  não está verde.
- Fidelidade aos frames do Figma e diagnósticos do Tailwind IntelliSense não
  foram validados nesta revisão.

## Referências

- `docs/api/cart.md`, `docs/api/quote.md` · `ARCHITECTURE.md` §5.3 · frames `11:1278`/`16:360`
