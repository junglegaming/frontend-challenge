# 19 — Deploy público (Vercel)

**Onda:** 11 · **Paralela com:** — · **Depende de:** 17, 18 · **Bloqueia:** 20
**Label sugerido:** `deploy` · **Esforço:** S

## Objetivo

Publicar a versão final com mocks e tempo real funcionando, acessível durante toda a
avaliação.

## Subtasks

### 19.1 — Build de demonstração

- Build com mocks ativos (`VITE_MOCKS=true`) — worker incluído no bundle

### 19.2 — Config SPA na Vercel

- Rewrite de todas as rotas para `index.html` — **acesso direto e refresh** de
  `/checkout`, `/orders/:id`, `/profile`, `/wallets` funcionando

### 19.3 — Assets e variáveis no ar

- Assets/imagens/fontes acessíveis na URL pública (sem serviços privados)
- Variáveis de ambiente definidas na plataforma (`VITE_MOCKS`, cenário default)

### 19.4 — Smoke test + registro da URL

- Na URL publicada: catálogo → compra completa → recibo; `?scenario=` ativo
- URL pública + repositório registrados para o envio

## Critérios de aceite (gate)

- [ ] URL pública responde com a build correspondente ao código entregue
- [ ] Todos os fluxos principais funcionam no ar (desktop e mobile)

## Referências

- `README.md` (enunciado) §12 · `docs/MOCKS.md` §1 · `PLANO.md` Fase 13
