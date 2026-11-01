# 13 — Performance: auditoria e Fase 1

> Rodada de 2026-10-31. O relatório completo da auditoria (diagnóstico, matriz
> de prioridades, alternativas) foi entregue à parte. Este documento registra o
> que foi implementado, como foi medido e o que fica para as próximas fases.

## 1. Diagnóstico resumido

- **Gargalo dominante:** as 4 artes eram PNGs de 357 KB a 1,07 MB (2,4 MB no
  total), usadas em todas as telas, inclusive como miniaturas de 58–164 px.
- **O Lighthouse subestima o problema:** o Service Worker do MSW intermedia as
  requisições, e o Lighthouse registra 0 bytes para elas. Por isso medimos com
  um proxy que limita banda no servidor (ver §4).
- **Segundo gargalo** (não tratado na Fase 1), a cascata de boot:
  entrada → MSW (164 KB gz) → `worker.start` → app (216 KB gz, sem split por
  rota). Ela limita o FCP a ~4 s em 4G lento.

## 2. O que a Fase 1 mudou

| Mudança | Arquivos | Por quê |
| --- | --- | --- |
| Artes convertidas para **WebP q85**, mesmas dimensões; PNGs removidos | `public/images/*.webp` | −94% de bytes (2.452 → 136 KB). PSNR de 39–41,6 dB em relação ao PNG; o canal alfa é preservado (0,3–0,4% de pixels transparentes nas bordas). |
| URLs atualizadas (66 ocorrências, 12 arquivos) | mocks, rotas, `Hero`, `Blog`, `Promos`, `FilterSidebar` | — |
| **Migração do banco salvo:** URLs `.png` reescritas para `.webp` ao carregar | `src/mocks/db.ts` (`LEGACY_ARTWORK_URL`) | O localStorage de quem já visitou guarda `imageUrl` antigos em NFTs, carrinhos e pedidos. Sem isso, as imagens quebrariam. |
| **CLS do Detalhe mobile:** `width`/`height` na arte principal | `src/routes/nft.$nftId.tsx` | Sem dimensões, a imagem reservava 178×178 e depois crescia para 280/320. Com os atributos, reserva o tamanho final em 320–767px (verificado). |
| `fetchPriority="high"` nas imagens de LCP | `Hero.tsx` (desktop), `nft.$nftId.tsx` (mobile e desktop) | Elementos de LCP medidos pelo Lighthouse. |
| `NftCard` com `isPriority`: a primeira linha da grade (2 cards no mobile, 3 no desktop) usa `loading="eager"` e prioridade alta; o restante continua `lazy` | `NftCard.tsx`, `NftGrid.tsx` | O elemento de LCP no mobile era um card com `loading="lazy"`. |
| `Cache-Control: public, max-age=31536000, immutable` em `/assets/*` | `vercel.json` | Arquivos com hash do Vite. `index.html`, `mockServiceWorker.js` e `/images` ficam com a revalidação padrão, de propósito. |

**Avaliado e descartado:** `<link rel="preload">` da imagem do hero no
`index.html`. No A/B, o LCP foi de 4,64 para 4,59 s (ruído) e o FCP piorou de
4,14 para 4,20 s: a imagem concorre com o JS por banda e continua dependendo do
render.

Comando de conversão (ImageMagick 7, uma vez por arte):

```bash
magick <arte>.png -quality 85 -define webp:method=6 <arte>.webp
```

## 3. Resultados

Mobile em 4G lento: 1,6 Mbps, 150 ms, CPU 4×, 412×823 @2,625. Baseline e Fase 1
medidos na mesma sessão.

| Página | Visita | Antes | Depois |
| --- | --- | --- | --- |
| Início | fria | LCP **9,76 s** · FCP 4,03 s | LCP **4,64 s (−52%)** · FCP 4,14 s |
| Início | repetida | LCP 1,28 s | LCP 1,30 s |
| Detalhe | fria | LCP **9,74 s** · CLS **0,082** | LCP **4,62 s (−53%)** · CLS **0,000** |
| Detalhe | repetida | LCP 1,34 s · CLS 0,082 | LCP 1,30 s · CLS 0,000 |

- O FCP não muda, como esperado: depende da cascata JS (Fase 2).
- As dicas de prioridade não tiveram efeito mensurável nesse cenário: a imagem
  só é pedida depois do render. Ficam por serem de baixo risco e cobrirem
  cenários de CPU rápida.
- Testes:
  - `typecheck`, `lint`, `prettier`: ok.
  - `test:unit`: 49/49.
  - `test:e2e`: 85/87 (2 skips intencionais de layout mobile); baselines
    visuais atualizadas e verdes.
  - A recodificação somou só +758 px (0,08% da tela) ao diff do Detalhe.
- Migração verificada: um banco com 50 URLs `.png` (incluindo carrinho e
  pedido) foi reescrito para `.webp`, sem nenhuma imagem quebrada.

## 4. Metodologia e limites

- Proxy local que limita banda e latência no servidor, valendo também para o
  tráfego do SW. Métricas lidas pela Performance API no Chromium do Playwright.
- n=2–3 por cenário, em localhost.
- Produção (cabeçalhos reais da Vercel, TTFB) não foi medida.

## 5. Fase 2

| Mudança | Arquivos | Por quê |
| --- | --- | --- |
| **Split por rota** (`autoCodeSplitting`) | `vite.config.ts` | O chunk inicial levava as 9 rotas, react-hook-form e socket.io. Chunk principal: 216 → 95 KB gz; rotas viram chunks de 1,4–13 KB gz. |
| `defaultPreload: 'intent'` | `src/app/mount.tsx` | Baixa o chunk da rota ao passar o mouse ou focar no link; a navegação não espera a rede. Verificado: o chunk do Detalhe é pedido no hover, antes do clique. |
| **zod fora do chunk de entrada**: a flag de mocks passou para `mocks-flag.ts` (sem dependências); `env.ts` continua validando com zod e é importado pelo `mount` | `src/app/mocks-flag.ts`, `src/app/env.ts`, `src/main.tsx`, `src/app/mount.tsx` | Entrada: 92 → 3,2 KB. O zod passa a ser baixado junto com o MSW, em paralelo, e não antes dele. A validação de env (`docs/11-REUSO-INTERNO.md` §6) foi preservada e continua falhando cedo. |
| `worker.start({ quiet: import.meta.env.PROD })` | `src/main.tsx` | O MSW registrava cada requisição no console em produção. Em dev, os logs continuam. |
| `favicon.svg` removido (467 KB; era um PNG em base64) | `index.html`, `public/favicon.svg` | Ícones cobertos por `favicon.ico` (48 px), PNGs de 16/32 px e `apple-touch-icon`. |

**A ordem MSW → socket.io continua garantida:** o `mount` só é importado
depois do `worker.start`, e o socket.io agora fica no chunk de `/pedido`.
Verificado no build de produção: compra completa até "Compra confirmada" via
evento de tempo real, sem erros, e nenhum log `[MSW]` no console.

### Resultados (4G lento; Fase 1 × Fase 2, mesma sessão)

| Página | Visita | Fase 1 | Fase 2 |
| --- | --- | --- | --- |
| Início | fria | FCP 4,01 · LCP 4,51 s | FCP **3,81** · LCP **4,31 s** |
| Detalhe | fria | FCP 4,11 · LCP 4,57 s | FCP **3,86** · LCP **4,34 s** |
| Início | repetida* | LCP 0,82 s | LCP 0,83 s |
| Detalhe | repetida* | LCP 0,84 s | LCP 0,85 s |

\* Com o `Cache-Control: immutable` do `vercel.json` simulado no proxy.

- **Sem esse cabeçalho**, que é o caso do `vite preview` (`no-cache`), a visita
  repetida da Fase 2 fica ~0,17 s mais lenta. Cada chunk extra paga uma
  revalidação, e o split adiciona um degrau (`mount` → rota). Ou seja, o
  cabeçalho do `vercel.json` é **pré-requisito** do split.
- O mesmo cabeçalho reduziu o LCP da visita repetida de 1,28 para 0,82 s
  (−36%).
- **CPU** (Lighthouse mobile, 3 execuções):
  - TBT 307 → 262 ms e tarefas longas 10 → 8, mas as faixas se sobrepõem
    (289–388 × 258–346 ms);
  - tempo de JS e do main thread inalterado (~1,35 s / ~2,3 s);
  - o ganho de CPU é **pequeno e dentro do ruído**: a execução é dominada por
    react-dom, MSW e render, não pelo código das rotas.
- Testes: `typecheck`, `lint`, `test:unit` 49/49; `test:e2e` 85/87 (2 skips
  intencionais de layout mobile).

## 6. Próximas fases (não implementadas)

- **Fase 3** (com benchmark):
  - variantes de tamanho + `srcset`;
  - download do app em paralelo ao MSW;
  - shell estático no HTML;
  - preload da fonte.
