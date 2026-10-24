# Contrato da verificação: `scripts/verify-deploy.mjs` (FR-012)

Um comando que prova que um ambiente está saudável. Interface:

```text
BASE_URL=<origem>/api  AUTH_JWT_SECRET=<segredo do ambiente>  [PROTECTION_BYPASS=<segredo>]
ADMIN_EMAIL=... ADMIN_PASSWORD=...  [DIRECT_PROBE_URLS=<urls separadas por vírgula>]
node scripts/verify-deploy.mjs
```

Saída: uma linha `✓`/`✗` por checagem; código de saída `0` só se todas passarem; mensagem específica por falha.
`BASE_URL` pode ser local, preview (com `PROTECTION_BYPASS`) ou produção. Também roda no domínio do site
(`https://<site>/backend`) para provar a cadeia ponta a ponta (FR-003).

## Checagens

| # | Checagem | Cobre |
|---|---|---|
| 1 | `GET /health` ⇒ `200 {"status":"ok"}` | US1, FR-001 |
| 2 | Rota inexistente ⇒ `404` com o JSON de erro da API (não a página da plataforma) | US1 cen. 3 |
| 3 | `/coins/*` sem token ⇒ `401`, sem tocar no banco | 007 FR-012 |
| 4 | Token expirado/adulterado ⇒ `401` | 007 FR-014 |
| 5 | Emitir token → crédito → débito → saldo → histórico, valores corretos | US1/US2 |
| 6 | Débito acima do saldo ⇒ `402` e saldo intacto | FR-005 |
| 7 | **Isolamento**: token do dono A nunca lê nem altera o dono B | 007 SC-007 |
| 8 | Login de admin correto emite token `role:"admin"`; e-mail desconhecido e senha errada têm a mesma resposta | US3 cen. 2 |
| 9 | Token de admin recusado em rota de dono e o inverso | FR-009 |
| 10 | **Concorrência**: 50 operações simultâneas (mistura de crédito e débito) no mesmo saldo; saldo final = inicial + soma das aceitas; recusas da plataforma (HTTP 403/429 com desafio) são contadas à parte e **não** como perda | SC-002 |
| 11 | **Invariante**: para o dono do teste, saldo = soma do histórico devolvido | SC-003 |
| 12 | **Idempotência**: a mesma chave repetida 5 vezes ⇒ efeito único; mesma chave com valor diferente ⇒ `409` | SC-005 |
| 13 | **Leitura direta negada**: nenhuma das `DIRECT_PROBE_URLS` (e nenhum padrão de URL pública de objeto) devolve dado de admin/saldo; o hash do admin do teste não aparece em nenhuma resposta | SC-004 |
| 14 | Latência: mede a primeira chamada e 20 seguintes; informa p95 e se ≤ 2 s | SC-006 |
| 15 | `GET /openapi.json` ⇒ `200` com `openapi` e os 6 caminhos públicos (`/health`, `/auth/token`, `/coins/*`); `GET /docs` ⇒ `200` HTML do Swagger UI. Avisa (sem falhar) se `/admin/*` não estiver documentado | 009, FR-001 |
| 16 | `/admin/owners?limit=2` devolve `cursor`; a página seguinte continua a primeira (ordem crescente, sem repetir `ownerId`); `/admin/owners/:ownerId` devolve o dono pedido. Pulada com `--skip-admin` | 007 rotas admin, FR-001 |

## Regras

- Cada execução usa donos novos (`verify-<timestamp>-<n>`), sem depender de estado anterior.
- Executar 10 vezes seguidas (`--repeat 10`, usado na aceitação de SC-002) sem nenhuma atualização perdida.
- A checagem 13 falha se a API ainda servir o registro do admin em qualquer endereço sem token de admin.
- O script nunca imprime segredos, tokens completos nem hashes.
