# 16 — Testes E2E (Playwright) + regressão visual

**Onda:** 9 · **Paralela com:** — · **Depende de:** 12, 13, 14 · **Bloqueia:** 20
**Label sugerido:** `testes` · **Esforço:** G

## Objetivo

Suíte E2E cobrindo os 12 fluxos do `README.md` §9 com mocks, cenários isolados e
regressão visual versionada.

## Subtasks

### 16.1 — Configuração do Playwright

- `playwright.config.ts`: projects `desktop-chromium` (1440×900) e `mobile-chromium`
  (390×844), `trace: 'retain-on-failure'`, reporter HTML + list

### 16.2 — Padrão de isolamento por spec

- `POST /api/_mock/reset` + cenário via `addInitScript` (`gm_scenario`) em cada spec —
  nenhum teste depende de outro (specs rodam em qualquer ordem)

### 16.3 — Specs 1–5 (descoberta e conta)

- 1. busca/filtros/ordenação/paginação/histórico · 2. detalhe direto + inexistente
- 3. cadastro/login/expiração/logout/troca · 4. favoritos com falha e recuperação
- 5. carrinho/qtd/remoção/cupom/persistência

### 16.4 — Specs 6–8 (compra, falhas, conta)

- 6. compra completa ao recibo
- 7. falha de pagamento + clique repetido + timeout idempotente
- 8. perfil/avatar/senha/carteiras com validação

### 16.5 — Specs 9–12 (tempo real, teclado, estados)

- 9. `nft.updated` via Socket.IO no checkout
- 10. eventos duplicados/antigos, desconexão, retomada de pedido
- 11. teclado/foco/validação · 12. skeletons sob latência + erro + retry

### 16.6 — Controle de tempo e eventos

- `page.clock.install`/`fastForward` em expiração e timeouts
- Eventos socket só via `POST /api/_mock/emit` (nunca setter direto na UI)

### 16.7 — Regressão visual

- Baselines de início, detalhe, carrinho e pagamento por viewport — seed estável,
  `reducedMotion: 'reduce'`

## Critérios de aceite (gate)

- [ ] `pnpm test:e2e` verde de ponta a ponta (desktop + mobile)
- [ ] Relatório HTML gerado · traces nas falhas · specs rodam em qualquer ordem

## Referências

- `README.md` (enunciado) §9 · `docs/MOCKS.md` §8 · `AGENTS.md` §10
