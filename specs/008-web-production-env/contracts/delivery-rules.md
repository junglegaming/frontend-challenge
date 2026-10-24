# Contrato de entrega HTTP: `apps/web` em produção

A interface exposta por este front-end a navegadores e à API é a configuração de entrega em
`apps/web/vercel.json`. Este documento é o contrato que ela precisa cumprir; a verificação de cada
linha está no `quickstart.md`.

## Ordem de avaliação (Vercel)

1. Cabeçalhos (`headers`) são aplicados à resposta final de qualquer rota que case.
2. Arquivos estáticos do build (`dist/`) têm precedência sobre rewrites.
3. `rewrites` são avaliados **na ordem declarada**; o primeiro que casa vence.

Por isso `/backend/:path*` vem **antes** do fallback da SPA.

## Rewrites

| Ordem | Origem | Destino | Observação |
|---|---|---|---|
| 1 | `/backend/:path*` | `https://nft-marketplace-api-ochre.vercel.app/api/:path*` | Mesma origem para o navegador; `Authorization` é repassado. Destino fixo (D4). |
| 2 | `/((?!assets/).*)` | `/index.html` | Fallback da SPA (FR-003). Só chega aqui o que não é arquivo estático nem `/backend/*`. Exclui `/assets/` de propósito: um asset ausente tem de ser `404`, não um `index.html` com `200`. |

Contrato de comportamento:

- `GET /backend/health` ⇒ resposta **da API real** (`200 {"status":"ok"}` quando saudável), nunca do mock.
- `GET /nft/nft_001` (qualquer rota da SPA) ⇒ `200 text/html` com o `index.html`.
- `GET /assets/<arquivo-inexistente>.js` ⇒ **não** deve devolver `index.html` com `200` mascarando o erro
  como script; um asset ausente é `404`.

## Cache

| Padrão | `Cache-Control` | Motivo |
|---|---|---|
| `/assets/(.*)` | `public, max-age=31536000, immutable` | Nome com hash do Vite: seguro cachear para sempre. |
| `/index.html` | `no-cache` | Aponta para os assets da versão atual; precisa revalidar. |
| `/mockServiceWorker.js` | `no-cache` (+ `Service-Worker-Allowed: /`) | Service worker preso em cache = visitante em versão antiga. |

## Cabeçalhos de segurança (todas as rotas)

| Cabeçalho | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | ver abaixo |

CSP (research D7):

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'self';
form-action 'self'; frame-ancestors 'none'
```

Critério de aceite: nenhuma violação de CSP no console durante um percurso completo (início → NFT →
carrinho → checkout → perfil) num build de produção. Violação ⇒ relaxar a diretiva específica, nunca
remover a política.

## O que este contrato **não** cobre

- Contrato de rotas da API (`/api/...`): `specs/007-monorepo-vercel-blob/contracts/api-routes.md`.
- Domínio próprio, CDN customizada, WAF: fora do escopo.

## Verificação local

Apenas os **cabeçalhos** de `/(.*)` são espelhados em `vite preview` (`vite.config.ts` lê o `vercel.json`),
para que o smoke local exercite a CSP real. Rewrites, fallback e cache só são verificáveis num deploy.
