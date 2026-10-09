# 20 — Revisão final contra critérios de avaliação

**Onda:** 12 · **Paralela com:** — · **Depende de:** 16, 19 · **Bloqueia:** entrega
**Label sugerido:** `revisao` · **Esforço:** M

## Objetivo

Varredura final da tabela de critérios (100 pontos) e dos itens **elimatórios** antes
de enviar.

## Subtasks

### 20.1 — Elimatórios (matar um por um)

- Stack obrigatória em uso efetivo (Router, Query, Axios, Socket.IO, MSW, Playwright —
  não só instalada)
- Fluxos principais funcionam de verdade (não visuais) — exercitar manualmente
- Compra confirmada **somente** com resposta da simulação
- Zero vazamento de dados entre usuários (troca de sessão limpa cache/subscriptions)
- Eventos de tempo real passam pelo cliente Socket.IO (nada de setter direto na UI)
- Testes E2E executáveis (`pnpm test:e2e` verde da ponta à ponta)

### 20.2 — Pontuação por critério

- Fidelidade visual 20pts — diff manual frame × tela em 1440/414 (9 telas)
- Fluxos/experiência 20pts — compra e conta completas, validações, recuperação de erros
- Integração/estado 15pts — busca/filtros/URL, invalidação, otimismo, cancelamento
- Tempo real 10pts — cenário de preço + reconexão + ordenação de eventos
- Mocking 10pts — 18 cenários, persistência, reset
- Testes 10pts — 12 specs + baselines
- Acessibilidade 5pts · Performance 5pts (mediana Lighthouse) · Docs 5pts

### 20.3 — Envio

- Deploy público + README da solução acessíveis
- Pendências conhecidas documentadas em `ARCHITECTURE.md` §10
- Link do repositório + URL pública enviados

## Critérios de aceite (gate)

- [ ] Todos os itens marcados · pendências conhecidas documentadas
- [ ] Envio: link do repositório + URL pública

## Referências

- `README.md` (enunciado) §11 e §12 · `PLANO.md` Fase 14
